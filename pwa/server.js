const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
const PORT = 3000;

const DATA_DIR = '/home/ubuntu/.openclaw/workspace/projects/task-app/data';
const INBOX_FILE = path.join(DATA_DIR, 'inbox.md');
const MEDIA_DIR = path.join(DATA_DIR, 'media');

// Create directories on startup
async function createDirs() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(MEDIA_DIR, { recursive: true });
        
        // Initialize inbox.md if it doesn't exist
        try {
            await fs.access(INBOX_FILE);
        } catch {
            await fs.writeFile(INBOX_FILE, '# Inbox\n\n', 'utf8');
        }
        
        console.log('Directories created successfully');
    } catch (err) {
        console.error('Error creating directories:', err);
    }
}

createDirs();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname)));
app.use('/media', express.static(MEDIA_DIR));

// Helper: Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Helper: Save base64 image to file
async function saveBase64Image(base64Data, filename) {
    const imagePath = path.join(MEDIA_DIR, filename);
    const data = base64Data.replace(/^data:image\/\w+;base64,/, '');
    await fs.writeFile(imagePath, data, 'base64');
    return `media/${filename}`;
}

// Helper: Parse tags
function parseTags(text) {
    const tagRegex = /#(\w+)/g;
    const tags = [];
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
        tags.push(match[1]);
    }
    
    return tags;
}

// Helper: Parse inbox.md into note objects
function parseInboxContent(content) {
    const notes = [];
    const lines = content.split('\n');
    let currentDate = null;
    
    for (const line of lines) {
        // Check for date header
        const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            currentDate = dateMatch[1];
            continue;
        }
        
        // Parse note entries (start with "- ")
        if (line.startsWith('- ') && currentDate) {
            const text = line.substring(2);
            
            // Check if it's a photo reference
            const photoMatch = text.match(/\[Photo\]\(media\/([^)]+)\)/);
            
            // Check if it's a markup reference
            const markupMatch = text.match(/\[Markup\]\(media\/([^)]+)\)/);
            
            if (photoMatch) {
                notes.push({
                    id: photoMatch[1].split('.')[0],
                    created_at: `${currentDate}T00:00:00`,
                    type: 'photo',
                    photo_url: `media/${photoMatch[1]}`,
                    tags: []
                });
            } else if (markupMatch) {
                notes.push({
                    id: markupMatch[1].split('.')[0],
                    created_at: `${currentDate}T00:00:00`,
                    type: 'markup',
                    photo_url: `media/${markupMatch[1]}`,
                    tags: []
                });
            } else {
                notes.push({
                    id: generateId(),
                    created_at: `${currentDate}T00:00:00`,
                    type: 'text',
                    content: text,
                    tags: parseTags(text)
                });
            }
        }
    }
    
    // Sort notes by created_at in descending order (most recent first)
    notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return notes;
}

// GET /api/notes - Retrieve all notes
app.get('/api/notes', async (req, res) => {
    try {
        const content = await fs.readFile(INBOX_FILE, 'utf8');
        const notes = parseInboxContent(content);
        res.json(notes);
    } catch (err) {
        console.error('Error loading notes:', err);
        res.status(500).json({ error: 'Failed to load notes' });
    }
});

// POST /api/notes - Create a new note
app.post('/api/notes', async (req, res) => {
    try {
        const { text, type, image, audio_url, photo_url, duration } = req.body;
        const noteId = generateId();
        const now = new Date().toISOString();
        const today = now.split('T')[0];
        
        let content = await fs.readFile(INBOX_FILE, 'utf8');
        
        // Check if date header exists
        const dateHeader = `## ${today}`;
        if (!content.includes(dateHeader)) {
            content += `\n${dateHeader}\n`;
        }
        
        let newNote = null;
        
        // Add note based on type
        if (type === 'photo' && image) {
            // Save photo file
            const imageName = `${noteId}.png`;
            const imagePath = path.join(MEDIA_DIR, imageName);
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            await fs.writeFile(imagePath, base64Data, 'base64');
            
            // Add photo reference to inbox
            content += `- [Photo](media/${imageName})\n`;
            
            newNote = {
                id: noteId,
                created_at: now,
                type: 'photo',
                photo_url: `media/${imageName}`,
                tags: []
            };
        } else if (type === 'audio' && text) {
            // Add audio note with transcription
            const noteText = text && text.trim() ? text.trim() : 'Untitled Note';
            content += `- ${noteText}\n`;
            
            newNote = {
                id: noteId,
                created_at: now,
                type: 'audio',
                audio_url: audio_url || '',
                content: noteText,
                duration: duration || 0,
                tags: []
            };
        } else if (type === 'markup' && photo_url) {
            // Add markup photo note
            content += `- [Markup](media/${photo_url.split('/').pop()})\n`;
            
            newNote = {
                id: noteId,
                created_at: now,
                type: 'markup',
                photo_url: photo_url,
                tags: []
            };
        } else {
            // Text note
            const noteText = text && text.trim() ? text.trim() : 'Untitled Note';
            content += `- ${noteText}\n`;
            
            newNote = {
                id: noteId,
                created_at: now,
                type: 'text',
                content: noteText,
                tags: parseTags(text)
            };
        }
        
        await fs.writeFile(INBOX_FILE, content, 'utf8');
        
        res.json(newNote);
    } catch (err) {
        console.error('Error creating note:', err);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// DELETE /api/notes/:id - Delete a note by ID
app.delete('/api/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let content = await fs.readFile(INBOX_FILE, 'utf8');
        const lines = content.split('\n');
        
        const filtered = lines.filter(line => {
            // Filter out lines containing the note ID
            return !line.includes(id);
        });
        
        await fs.writeFile(INBOX_FILE, filtered.join('\n'), 'utf8');
        
        res.json({ success: true, id });
    } catch (err) {
        console.error('Error deleting note:', err);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// POST /api/transcribe - Transcribe audio using Whisper CLI
app.post('/api/transcribe', async (req, res) => {
    try {
        if (!req.body || !req.body.audio) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        
        const { audio } = req.body;
        const audioId = generateId();
        const audioPath = path.join(MEDIA_DIR, `${audioId}.webm`);
        const outputPath = path.join(MEDIA_DIR, `${audioId}.txt`);
        
        // Save audio file
        const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
        await fs.writeFile(audioPath, base64Data, 'base64');
        
        // Run Whisper CLI
        const { stdout } = await execAsync(`whisper ${audioPath} --output_format txt --output_dir ${MEDIA_DIR} --model base`);
        
        // Read transcription
        const transcription = await fs.readFile(outputPath, 'utf8');
        
        // Cleanup
        await fs.unlink(audioPath);
        await fs.unlink(outputPath);
        
        res.json({ text: transcription.trim() });
    } catch (err) {
        console.error('Transcription error:', err);
        res.status(500).json({ error: 'Server error during transcription' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
});