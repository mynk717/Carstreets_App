// app/lib/utils/image-validator.ts (create this file)
export async function validateImageUrls(imageUrls: string[]) {
  const validUrls = []
  
  for (const url of imageUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        validUrls.push(url)
      }
    } catch (error) {
      console.warn('Invalid image URL:', url)
    }
  }
  
  return validUrls
}
