"use client";

import { useState, useEffect, useCallback } from "react";
import type { Question, Content, Subject } from "@/types";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

const IMG_SIZES = ["small", "medium", "large", "inline"];

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, Partial<Question>>>(
    {}
  );
  // Removed unused setFilters
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const [selectedContentId, setSelectedContentId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [imgModal, setImgModal] = useState<{ src: string; alt: string } | null>(
    null
  );

  const fetchQuestions = useCallback(
    async (loadMore = false, contentId?: string, subjectId?: string) => {
      setLoading(true);
      try {
        let query = supabase
          .from("questions")
          .select(
            `
            *,
            contents(id, name),
            subjects(id, subject_name, chapter_name, chapter_no)
          `
          )
          .order("created_at", { ascending: false })
          .range(page * 20, (page + 1) * 20 - 1);

        // Remove all filter logic since 'filters' is removed
        // If you want to keep search/filter, reintroduce only the necessary state and logic

        if (contentId) {
          query = query.eq("content_id", contentId);
        }
        if (subjectId) {
          query = query.eq("subject_id", subjectId);
        }

        const { data } = await query;

        const formattedQuestions = Array.isArray(data)
          ? data
              .filter(
                (q: unknown): q is Question =>
                  typeof q === "object" && q !== null
              )
              .map((q) => ({ ...q }))
          : [];

        if (loadMore) {
          setQuestions((prev) => [...prev, ...(formattedQuestions || [])]);
        } else {
          setQuestions(formattedQuestions || []);
        }

        setHasMore(data?.length === 20);
        if (loadMore) {
          setPage((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch questions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [page, toast]
  );

  const fetchContentsAndSubjects = useCallback(async () => {
    try {
      const [contentsResponse, subjectsResponse] = await Promise.all([
        supabase.from("contents").select("*"),
        supabase.from("subjects").select("*"),
      ]);

      if (contentsResponse.error) throw contentsResponse.error;
      if (subjectsResponse.error) throw subjectsResponse.error;

      setContents(contentsResponse.data || []);
      setSubjects(subjectsResponse.data || []);
    } catch (error) {
      console.error("Error fetching contents and subjects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contents and subjects. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchContentsAndSubjects();
  }, [fetchContentsAndSubjects]);

  useEffect(() => {
    if (selectedContentId && selectedSubjectId) {
      setPage(0);
      fetchQuestions(false, selectedContentId, selectedSubjectId);
    } else {
      setQuestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContentId, selectedSubjectId]);

  const handleLoadMore = () => {
    fetchQuestions(true, selectedContentId, selectedSubjectId);
  };

  // Inline edit handlers
  const handleEditChange = (
    id: string,
    field: keyof Question,
    value: string | number | { src: string; img_size: string }[] | undefined
  ) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Helper to check if a question has unsaved changes
  const hasUnsavedChanges = (id: string) => {
    if (!editState[id]) return false;
    const orig = questions.find((q) => q.id === id);
    if (!orig) return false;
    const edited = editState[id];
    // Only compare fields that are editable
    return (
      (edited.question !== undefined && edited.question !== orig.question) ||
      (edited.answer !== undefined &&
        JSON.stringify(edited.answer) !== JSON.stringify(orig.answer)) ||
      (edited.marks !== undefined && edited.marks !== orig.marks) ||
      (edited.question_images !== undefined &&
        JSON.stringify(edited.question_images) !==
          JSON.stringify(orig.question_images)) ||
      (edited.answer_images !== undefined &&
        JSON.stringify(edited.answer_images) !==
          JSON.stringify(orig.answer_images))
    );
  };

  // Add img_size editing logic for both question and answer images
  const handleImageSizeChange = (
    id: string,
    imgIdx: number,
    size: string,
    type: "question_images" | "answer_images"
  ) => {
    setEditState((prev) => {
      const orig = questions.find((q) => q.id === id);
      type ImgType = { src: string; img_size: string } | string;
      const origImages: ImgType[] = Array.isArray(orig?.[type])
        ? [...(orig![type] as ImgType[])]
        : [];
      // Only map strings to {src, img_size}, ignore objects
      const origStringImages = origImages.filter(
        (img): img is string => typeof img === "string"
      );
      let prevImages: { src: string; img_size: string }[] = [];
      if (Array.isArray(prev[id]?.[type])) {
        prevImages = (prev[id]?.[type] as unknown[])
          .map((img) =>
            typeof img === "string"
              ? { src: img, img_size: "medium" }
              : typeof img === "object" &&
                img !== null &&
                "src" in img &&
                "img_size" in img
              ? (img as { src: string; img_size: string })
              : null
          )
          .filter((img): img is { src: string; img_size: string } => !!img);
      } else {
        prevImages = origStringImages.map((img) => ({
          src: img,
          img_size: "medium",
        }));
      }
      prevImages[imgIdx] = { ...prevImages[imgIdx], img_size: size };
      return {
        ...prev,
        [id]: {
          ...prev[id],
          [type]: prevImages,
        },
      };
    });
  };

  const handleSave = async (id: string) => {
    setUpdatingId(id);
    const updated = editState[id];
    try {
      const { error } = await supabase
        .from("questions")
        .update(updated)
        .eq("id", id);
      if (error) throw error;
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...updated } : q))
      );
      toast({ title: "Saved", description: "Question updated." });
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to update question.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Question Bank</h1>
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        <select
          className="w-full sm:w-1/3 border rounded p-2 text-sm"
          value={selectedContentId}
          onChange={(e) => {
            setSelectedContentId(e.target.value);
            setSelectedSubjectId("");
          }}
        >
          <option value="">Select Content</option>
          {contents.map((content) => (
            <option key={content.id} value={content.id}>
              {content.name} (Class {content.class}, {content.medium})
            </option>
          ))}
        </select>
        <select
          className="w-full sm:w-1/3 border rounded p-2 text-sm"
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          disabled={!selectedContentId}
        >
          <option value="">Select Subject</option>
          {subjects
            .filter((s) => s.content_id?.toString() === selectedContentId)
            .map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subject_name} - Ch {subject.chapter_no}:{" "}
                {subject.chapter_name}
              </option>
            ))}
        </select>
      </div>
      {selectedContentId && selectedSubjectId ? (
        <>
          {loading && page === 0 ? (
            <div className="text-center py-8">Loading questions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Question</th>
                    <th className="border p-2">Answer</th>
                    <th className="border p-2">Marks</th>
                    <th className="border p-2">Question Images</th>
                    <th className="border p-2">Answer Images</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => {
                    const edit = editState[q.id] || {};
                    // For image editing, ensure we have an array of objects {src, img_size}
                    const origQImages = Array.isArray(q.question_images)
                      ? q.question_images
                      : [];
                    const origAImages = Array.isArray(q.answer_images)
                      ? q.answer_images
                      : [];
                    type ImgType = { src: string; img_size: string } | string;
                    let qImages: { src: string; img_size: string }[] = [];
                    let aImages: { src: string; img_size: string }[] = [];
                    if (Array.isArray(edit.question_images)) {
                      qImages = (edit.question_images as ImgType[]).map((img) =>
                        typeof img === "string"
                          ? { src: img, img_size: "medium" }
                          : img
                      );
                    } else {
                      qImages = (origQImages as ImgType[]).map((img) =>
                        typeof img === "string"
                          ? { src: img, img_size: "medium" }
                          : img
                      );
                    }
                    if (Array.isArray(edit.answer_images)) {
                      aImages = (edit.answer_images as ImgType[]).map((img) =>
                        typeof img === "string"
                          ? { src: img, img_size: "medium" }
                          : img
                      );
                    } else {
                      aImages = (origAImages as ImgType[]).map((img) =>
                        typeof img === "string"
                          ? { src: img, img_size: "medium" }
                          : img
                      );
                    }
                    return (
                      <tr key={q.id} className="border-b">
                        <td className="border p-2 min-w-[200px]">
                          <textarea
                            className="w-full border rounded p-1"
                            value={edit.question ?? q.question ?? ""}
                            onChange={(e) =>
                              handleEditChange(q.id, "question", e.target.value)
                            }
                            rows={2}
                          />
                        </td>
                        <td className="border p-2 min-w-[200px]">
                          <textarea
                            className="w-full border rounded p-1"
                            value={
                              edit.answer !== undefined
                                ? typeof edit.answer === "string"
                                  ? edit.answer
                                  : JSON.stringify(edit.answer)
                                : typeof q.answer === "string"
                                ? q.answer
                                : q.answer
                                ? JSON.stringify(q.answer)
                                : ""
                            }
                            onChange={(e) =>
                              handleEditChange(q.id, "answer", e.target.value)
                            }
                            rows={2}
                          />
                        </td>
                        <td className="border p-2 min-w-[60px]">
                          <input
                            type="number"
                            className="w-16 border rounded p-1"
                            value={edit.marks ?? q.marks ?? 1}
                            min={1}
                            onChange={(e) =>
                              handleEditChange(
                                q.id,
                                "marks",
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="border p-2 min-w-[180px]">
                          <div className="flex flex-col gap-2">
                            {qImages.map((img, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <img
                                  src={img.src}
                                  alt={`qimg-${idx}`}
                                  style={{
                                    width: 80,
                                    height: 80,
                                    objectFit: "contain",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    setImgModal({
                                      src: img.src,
                                      alt: `qimg-${idx}`,
                                    })
                                  }
                                />
                                <select
                                  className="border rounded p-1 text-xs"
                                  value={img.img_size}
                                  onChange={(e) =>
                                    handleImageSizeChange(
                                      q.id,
                                      idx,
                                      e.target.value,
                                      "question_images"
                                    )
                                  }
                                >
                                  {IMG_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="border p-2 min-w-[180px]">
                          <div className="flex flex-col gap-2">
                            {aImages.map((img, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2"
                              >
                                <img
                                  src={img.src}
                                  alt={`aimg-${idx}`}
                                  style={{
                                    width: 80,
                                    height: 80,
                                    objectFit: "contain",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    setImgModal({
                                      src: img.src,
                                      alt: `aimg-${idx}`,
                                    })
                                  }
                                />
                                <select
                                  className="border rounded p-1 text-xs"
                                  value={img.img_size}
                                  onChange={(e) =>
                                    handleImageSizeChange(
                                      q.id,
                                      idx,
                                      e.target.value,
                                      "answer_images"
                                    )
                                  }
                                >
                                  {IMG_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="border p-2 min-w-[100px]">
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-60"
                            onClick={() => handleSave(q.id)}
                            disabled={
                              updatingId === q.id || !hasUnsavedChanges(q.id)
                            }
                          >
                            {updatingId === q.id ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    className="bg-gray-200 px-4 py-2 rounded"
                    onClick={handleLoadMore}
                  >
                    Load More
                  </button>
                </div>
              )}
              {/* Image Modal */}
              {imgModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                  <div className="bg-white rounded shadow-lg p-4 relative max-w-lg w-full flex flex-col items-center">
                    <img
                      src={imgModal.src}
                      alt={imgModal.alt}
                      className="max-w-full max-h-[70vh]"
                    />
                    <button
                      className="absolute top-2 right-2 bg-gray-200 rounded-full px-2 py-1 text-xs"
                      onClick={() => setImgModal(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Please select content and subject to view questions.
        </div>
      )}
    </div>
  );
}
