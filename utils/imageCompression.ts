import imageCompression from "browser-image-compression"

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return new File([compressedFile], compressedFile.name, {
      type: compressedFile.type,
      lastModified: new Date().getTime(),
    })
  } catch (error) {
    console.error("Error compressing image:", error)
    return file
  }
}

