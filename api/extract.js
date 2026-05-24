export const config = {
  api: { bodyParser: false },
  maxDuration: 30,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Polyfill browser APIs for pdfjs-dist
  if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrix {
      constructor(init) {
        const v = init || [1,0,0,1,0,0]
        this.a=v[0];this.b=v[1];this.c=v[2];this.d=v[3];this.e=v[4];this.f=v[5]
        this.is2D=true;this.isIdentity=false
      }
      static fromFloat32Array(a){return new DOMMatrix(a)}
      static fromFloat64Array(a){return new DOMMatrix(a)}
      static fromMatrix(){return new DOMMatrix()}
      inverse(){return new DOMMatrix()}
      multiply(){return new DOMMatrix()}
      translate(){return new DOMMatrix()}
      scale(){return new DOMMatrix()}
      rotate(){return new DOMMatrix()}
      transformPoint(p){return p||{x:0,y:0,z:0,w:1}}
    }
  }
  if (typeof globalThis.Path2D === 'undefined') {
    globalThis.Path2D = class Path2D {
      constructor(){}moveTo(){}lineTo(){}bezierCurveTo(){}quadraticCurveTo(){}rect(){}arc(){}closePath(){}
    }
  }

  const chunks = []
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const buffer = Buffer.concat(chunks)

  if (buffer.length === 0) {
    return res.status(400).json({ error: 'No data received' })
  }

  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''

    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    }).promise

    let fullText = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return res.status(200).json({ text: fullText, pages: doc.numPages })
  } catch (err) {
    return res.status(500).json({ error: 'PDF parse error: ' + err.message })
  }
}