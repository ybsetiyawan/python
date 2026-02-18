export const useOcr = () => {
  const config = useRuntimeConfig()

  const uploadFiles = async (files) => {
    const formData = new FormData()

    for (let file of files) {
      formData.append("files", file)
    }

    const { data, error } = await useFetch(
      `${config.public.apiBase}/ocr`,
      {
        method: "POST",
        body: formData
      }
    )

    return { data, error }
  }

  return {
    uploadFiles
  }
}
