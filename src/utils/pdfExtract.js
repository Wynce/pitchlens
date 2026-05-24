function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export async function extractPDF(file) {
  if (isMobile()) {
    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > 5) {
      throw new Error(
        `This PDF is ${sizeMB.toFixed(1)}MB. Mobile works best with files under 5MB. ` +
        `Please try on desktop for larger pitch decks.`
      )
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const dataUrl = reader.result
          const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1)
          resolve({ mode: 'document', pdfBase64: base64 })
        } catch (e) {
          reject(new Error('Could not process this PDF on mobile. Please try on desktop.'))
        }
      }
      reader.onerror = () => reject(new Error('Could not read file. Please try again.'))
      reader.readAsDataURL(file)
    })
  }

  const { extractDesktop } = await import('./pdfExtractDesktop.js')
  return extractDesktop(file)
}