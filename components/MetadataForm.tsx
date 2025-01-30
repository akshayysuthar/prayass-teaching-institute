import type React from "react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/utils/supabase/client"
import { Content, Subject } from "@/types"

interface MetadataFormProps {
  metadata: {
    content_id: string
    subject_id: string
    sectionTitle: string
    type: string
  }
  handleMetadataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function MetadataForm({ metadata, handleMetadataChange }: MetadataFormProps) {
  const [contents, setContents] = useState<Content[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedContentMedium, setSelectedContentMedium] = useState<string>("")

  useEffect(() => {
    fetchContents()
  }, [])

  useEffect(() => {
    if (metadata.content_id) {
      fetchSubjects(metadata.content_id)
      fetchContentMedium(metadata.content_id)
    }
  }, [metadata.content_id])

  const fetchContents = async () => {
    const { data, error } = await supabase.from("contents").select("*")
    if (error) {
      console.error("Error fetching contents:", error)
    } else {
      setContents(data)
    }
  }

  const fetchSubjects = async (content_id: string) => {
    const { data, error } = await supabase.from("subjects").select("*").eq("content_id", content_id)
    if (error) {
      console.error("Error fetching subjects:", error)
    } else {
      setSubjects(data)
    }
  }

  const fetchContentMedium = async (content_id: string) => {
    const { data, error } = await supabase.from("contents").select("medium").eq("id", content_id).single()
    if (error) {
      console.error("Error fetching content medium:", error)
    } else {
      setSelectedContentMedium(data.medium)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Metadata</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="content_id">Content</Label>
          <Select
            name="content_id"
            value={metadata.content_id}
            onValueChange={(value) =>
              handleMetadataChange({
                target: { name: "content_id", value },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select content" />
            </SelectTrigger>
            <SelectContent>
              {contents.map((content) => (
                <SelectItem key={content.id} value={content.id.toString()}>
                  {content.name} - {content.board} - {content.medium} - Class {content.class}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subject_id">Subject</Label>
          <Select
            name="subject_id"
            value={metadata.subject_id}
            onValueChange={(value) =>
              handleMetadataChange({
                target: { name: "subject_id", value },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.subject_name} - Chapter {subject.chapter_no}: {subject.chapter_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sectionTitle">Section Title</Label>
          <Input
            id="sectionTitle"
            name="sectionTitle"
            value={metadata.sectionTitle}
            onChange={handleMetadataChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Question Type</Label>
          <Input id="type" name="type" value={metadata.type} onChange={handleMetadataChange} required />
        </div>
      </div>
      {selectedContentMedium && (
        <div>
          <Label>Selected Content Medium: {selectedContentMedium}</Label>
        </div>
      )}
    </div>
  )
}

