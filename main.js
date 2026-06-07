// Configurar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '[cdnjs.cloudflare.com](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js)';

// Elementos del DOM
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFile = document.getElementById('removeFile');
const options = document.getElementById('options');
const optionBtns = document.querySelectorAll('.option-btn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const resultTitle = document.getElementById('resultTitle');
const resultContent = document.getElementById('resultContent');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newDocument = document.getElementById('newDocument');

// Estado
let currentFile = null;
let extractedText = '';

// Eventos de drag & drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

uploadZone.addEventListener('click', (e) => {
    if (e.target.closest('.upload-btn')) return;
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

removeFile.addEventListener('click', resetUpload);

// Manejar archivo
async function handleFile(file) {
    const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(file.type)) {
        alert('Por favor, sube un archivo PDF o Word (.doc, .docx)');
        return;
    }
    
    currentFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    uploadZone.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    
    // Extraer texto
    loading.classList.remove('hidden');
    
    try {
        if (file.type === 'application/pdf') {
            extractedText = await extractPdfText(file);
        } else {
            extractedText = await extractWordText(file);
        }
        
        loading.classList.add('hidden');
        
        if (extractedText.trim().length < 50) {
            alert('No se pudo extraer suficiente texto del documento. Asegúrate de que el archivo contiene texto legible.');
            resetUpload();
            return;
        }
        
        options.classList.remove('hidden');
    } catch (error) {
        console.error('Error al procesar:', error);
        loading.classList.add('hidden');
        alert('Error al procesar el documento. Intenta con otro archivo.');
        resetUpload();
    }
}

// Extraer texto de PDF
async function extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n\n';
    }
    
    return text;
}

// Extraer texto de Word
async function extractWordText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

// Opciones de generación
optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        optionBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        generateContent(btn.dataset.type);
    });
});

// Generar contenido
function generateContent(type) {
    options.classList.add('hidden');
    loading.classList.remove('hidden');
    
    // Simulamos procesamiento
    setTimeout(() => {
        loading.classList.add('hidden');
        
        let output = '';
        const titles = {
            resumen: '📝 Resumen',
            apuntes: '📖 Apuntes de Estudio',
            esquema: '🗂️ Esquema',
            preguntas: '❓ Preguntas de Autoevaluación'
        };
        
        resultTitle.textContent = titles[type];
        
        switch (type) {
            case 'resumen':
                output = generateResumen(extractedText);
                break;
            case 'apuntes':
                output = generateApuntes(extractedText);
                break;
            case 'esquema':
                output = generateEsquema(extractedText);
                break;
            case 'preguntas':
                output = generatePreguntas(extractedText);
                break;
        }
        
        resultContent.innerHTML = output;
        result.classList.remove('hidden');
    }, 1500);
}

// Generadores de contenido
function generateResumen(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const important = sentences.slice(0, Math.min(10, sentences.length));
    
    const keywords = extractKeywords(text);
    
    let html = `<h3>Resumen del Documento</h3>\n\n`;
    html += `<p><strong>Palabras clave:</strong> ${keywords.join(', ')}</p>\n\n`;
    html += `<h4>Puntos principales:</h4>\n<ul>`;
    
    important.forEach(sentence => {
        const clean = sentence.trim();
        if (clean.length > 30) {
            html += `<li>${clean}.</li>\n`;
        }
    });
    
    html += `</ul>\n\n`;
    html += `<p><em>Documento procesado: ${currentFile.name}</em></p>`;
    
    return html;
}

function generateApuntes(text) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
    const keywords = extractKeywords(text);
    
    let html = `<h3>📚 Apuntes de Estudio</h3>\n\n`;
    
    html += `<h4>🔑 Conceptos Clave</h4>\n<ul>`;
    keywords.slice(0, 8).forEach(kw => {
        html += `<li><strong>${kw}</strong></li>\n`;
    });
    html += `</ul>\n\n`;
    
    html += `<h4>📌 Ideas Principales</h4>\n`;
    
    const mainIdeas = paragraphs.slice(0, 5);
    mainIdeas.forEach((p, i) => {
        const summary = p.substring(0, 200).trim();
        html += `<p><strong>${i + 1}.</strong> ${summary}...</p>\n`;
    });
    
    html += `\n<h4>💡 Para recordar</h4>\n`;
    html += `<ul>`;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
    const random = sentences.sort(() => Math.random() - 0.5).slice(0, 5);
    random.forEach(s => {
        html += `<li>${s.trim()}.</li>\n`;
    });
    html += `</ul>`;
    
    return html;
}

function generateEsquema(text) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 30);
    const keywords = extractKeywords(text);
    
    let html = `<h3>🗂️ Esquema del Contenido</h3>\n\n`;
    
    html += `<h4>I. Introducción</h4>\n`;
    if (paragraphs[0]) {
        html += `<p style="margin-left: 20px;">• ${paragraphs[0].substring(0, 150).trim()}...</p>\n`;
    }
    
    html += `\n<h4>II. Conceptos Principales</h4>\n`;
    html += `<ul style="margin-left: 20px;">`;
    keywords.slice(0, 6).forEach(kw => {
        html += `<li>${kw}</li>`;
    });
    html += `</ul>\n`;
    
    html += `\n<h4>III. Desarrollo</h4>\n`;
    paragraphs.slice(1, 4).forEach((p, i) => {
        const firstSentence = p.split(/[.!?]/)[0];
        html += `<p style="margin-left: 20px;"><strong>${i + 1}.</strong> ${firstSentence.trim()}</p>\n`;
    });
    
    html += `\n<h4>IV. Puntos Clave</h4>\n`;
    html += `<ul style="margin-left: 20px;">`;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 40);
    sentences.slice(0, 4).forEach(s => {
        html += `<li>${s.trim()}</li>`;
    });
    html += `</ul>\n`;
    
    html += `\n<h4>V. Conclusión</h4>\n`;
    if (paragraphs.length > 2) {
        const last = paragraphs[paragraphs.length - 1];
        html += `<p style="margin-left: 20px;">• ${last.substring(0, 150).trim()}...</p>`;
    }
    
    return html;
}

function generatePreguntas(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 40);
    const keywords = extractKeywords(text);
    
    let html = `<h3>❓ Preguntas de Autoevaluación</h3>\n\n`;
    
    html += `<h4>Preguntas de Comprensión</h4>\n<ol>`;
    
    // Generar preguntas basadas en el contenido
    const questionStarters = [
        '¿Qué significa',
        '¿Cuál es la importancia de',
        '¿Cómo se relaciona',
        '¿Por qué es relevante',
        '¿Qué características tiene'
    ];
    
    keywords.slice(0, 5).forEach((kw, i) => {
        html += `<li>${questionStarters[i % questionStarters.length]} <strong>${kw}</strong>?</li>\n`;
    });
    html += `</ol>\n\n`;
    
    html += `<h4>Preguntas de Análisis</h4>\n<ol>`;
    
    sentences.slice(0, 3).forEach(s => {
        const topic = s.trim().substring(0, 50);
        html += `<li>Explica con tus propias palabras: "${topic}..."</li>\n`;
    });
    html += `</ol>\n\n`;
    
    html += `<h4>Verdadero o Falso</h4>\n<ol>`;
    sentences.slice(3, 6).forEach(s => {
        html += `<li>${s.trim()}. <em>(V/F)</em></li>\n`;
    });
    html += `</ol>\n\n`;
    
    html += `<h4>Para Reflexionar</h4>\n`;
    html += `<p>• ¿Cuáles son los puntos más importantes del documento?</p>`;
    html += `<p>• ¿Cómo aplicarías esta información en la práctica?</p>`;
    html += `<p>• ¿Qué dudas te han surgido durante la lectura?</p>`;
    
    return html;
}

// Extraer palabras clave
function extractKeywords(text) {
    const stopWords = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
        'en', 'con', 'por', 'para', 'que', 'es', 'son', 'y', 'o', 'a', 'se', 'su',
        'como', 'más', 'este', 'esta', 'estos', 'estas', 'pero', 'si', 'no', 'ya',
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
        'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its'
    ]);
    
    const words = text.toLowerCase()
        .replace(/[^a-záéíóúñü\s]/gi, '')
        .split(/\s+/)
        .filter(w => w.length > 4 && !stopWords.has(w));
    
    const frequency = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

// Utilidades
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function resetUpload() {
    currentFile = null;
    extractedText = '';
    fileInput.value = '';
    
    uploadZone.classList.remove('hidden');
    fileInfo.classList.add('hidden');
    options.classList.add('hidden');
    loading.classList.add('hidden');
    result.classList.add('hidden');
    
    optionBtns.forEach(btn => btn.classList.remove('selected'));
}

// Copiar resultado
copyBtn.addEventListener('click', () => {
    const text = resultContent.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const original = copyBtn.textContent;
        copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
            copyBtn.textContent = original;
        }, 2000);
    });
});

// Descargar resultado
downloadBtn.addEventListener('click', () => {
    const text = resultContent.innerText;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apuntes_${currentFile.name.replace(/\.[^/.]+$/, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});

// Nuevo documento
newDocument.addEventListener('click', resetUpload);
