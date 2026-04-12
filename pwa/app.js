class TaskCaptureApp {
  constructor() {
    this.notes = [];
    this.stream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingTimer = null;
    this.currentPhoto = null;
    this.markupCanvas = null;
    this.markupCtx = null;
    this.markupTool = 'pen';
    this.markupColor = '#ff0000';
    this.markupHistory = [];
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.apiBaseUrl = '/api/notes';
    this.currentView = 'inbox';
    this.journalAutoSaveTimer = null;

    this.init();
  }

  init() {
    this.loadNotes();
    this.setupEventListeners();
    this.setupServiceWorker();
    this.setupNavigation();
    this.setupReflection();
    this.setupJournal();
  }
  
  async loadNotes() {
    try {
      const response = await fetch(this.apiBaseUrl);
      if (response.ok) {
        this.notes = await response.json();
        this.renderInbox();
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      this.notes = [];
      this.renderInbox();
    }
  }
  
  renderInbox() {
    const content = document.getElementById('content');
    if (!content) return;
    
    const groupedNotes = this.groupNotesByDate(this.notes);
    
    content.innerHTML = Object.entries(groupedNotes)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, notes]) => `
        <div class="date-group">
          <h3 class="date-header">${this.formatDate(date)}</h3>
          <div class="notes-list">
            ${notes.map(note => this.renderNote(note)).join('')}
          </div>
        </div>
      `).join('');
  }
  
  groupNotesByDate(notes) {
    return notes.reduce((groups, note) => {
      const date = new Date(note.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(note);
      return groups;
    }, {});
  }
  
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  renderNote(note) {
    let content = '';
    
    if (note.type === 'text') {
      content = `<p class="note-text">${this.escapeHtml(note.content)}</p>`;
    } else if (note.type === 'audio') {
      content = `
        <div class="note-audio">
          <audio controls src="${note.audio_url}"></audio>
          <span class="duration">${this.formatDuration(note.duration)}</span>
        </div>
      `;
    } else if (note.type === 'photo') {
      content = `
        <div class="note-photo">
          <img src="${note.photo_url}" alt="Note photo" loading="lazy">
        </div>
      `;
    } else if (note.type === 'markup') {
      content = `
        <div class="note-markup">
          <img src="${note.photo_url}" alt="Markup photo" loading="lazy">
        </div>
      `;
    }
    
    // Format: YYYY-MM-DD HH:MM (24-hour format)
    const date = new Date(note.created_at);
    const dateStr = date.toISOString().substring(0, 16).replace('T', ' ');
    
    const isReflection = note.tags && note.tags.includes('reflection');

    return `
      <div class="note-item${isReflection ? ' note-reflection' : ''}" data-id="${note.id}">
        <div class="note-header">
          <span class="note-type">${this.getTypeIcon(note.type, note.tags)}</span>
          <span class="note-time">${dateStr}</span>
          <button class="btn-delete" data-id="${note.id}" aria-label="Delete note">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        ${content}
      </div>
    `;
  }
  
  getTypeIcon(type, tags) {
    // Show reflection icon if tagged
    if (tags && tags.includes('reflection')) return '💭';
    const icons = {
      text: '📝',
      audio: '🎤',
      photo: '📷',
      markup: '✏️'
    };
    return icons[type] || '📌';
  }
  
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  setupEventListeners() {
    // Main capture buttons
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        this.showModal('voice-modal');
        this.startRecording();
      });
    }
    
    const cameraBtn = document.getElementById('camera-btn');
    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => {
        this.showModal('camera-modal');
      });
    }
    
    const textBtn = document.getElementById('text-btn');
    if (textBtn) {
      textBtn.addEventListener('click', () => {
        this.showModal('text-modal');
      });
    }
    
    // Quick text input
    const quickText = document.getElementById('quick-text');
    if (quickText) {
      quickText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && quickText.value.trim()) {
          this.saveQuickText(quickText.value.trim());
          quickText.value = '';
        }
      });
    }
    
    // Modal buttons
    document.querySelectorAll('[data-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        if (modalId) {
          this.showModal(modalId);
        }
      });
    });
    
    // Close modal buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });
    
    // Close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });
    
    // Voice modal buttons
    const stopVoiceBtn = document.getElementById('stop-voice');
    if (stopVoiceBtn) {
      stopVoiceBtn.addEventListener('click', () => {
        this.stopRecording();
        this.hideModal('voice-modal');
      });
    }
    
    const cancelVoiceBtn = document.getElementById('cancel-voice');
    if (cancelVoiceBtn) {
      cancelVoiceBtn.addEventListener('click', () => {
        this.stopRecording();
        this.hideModal('voice-modal');
      });
    }
    
    // Camera modal buttons
    const capturePhotoBtn = document.getElementById('capture-photo');
    if (capturePhotoBtn) {
      capturePhotoBtn.addEventListener('click', () => this.capturePhoto());
    }
    
    const useGalleryBtn = document.getElementById('use-gallery');
    if (useGalleryBtn) {
      useGalleryBtn.addEventListener('click', () => {
        document.getElementById('gallery-input').click();
      });
    }
    
    const galleryInput = document.getElementById('gallery-input');
    if (galleryInput) {
      galleryInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleGalleryPhoto(e.target.files[0]);
        }
      });
    }
    
    const cancelCameraBtn = document.getElementById('cancel-camera');
    if (cancelCameraBtn) {
      cancelCameraBtn.addEventListener('click', () => {
        this.hideModal('camera-modal');
      });
    }
    
    // Text modal buttons
    const saveTextBtn = document.getElementById('save-text');
    if (saveTextBtn) {
      saveTextBtn.addEventListener('click', () => {
        const textarea = document.getElementById('note-input');
        if (textarea && textarea.value.trim()) {
          this.saveQuickText(textarea.value.trim());
          textarea.value = '';
        }
        this.hideModal('text-modal');
      });
    }
    
    const cancelTextBtn = document.getElementById('cancel-text');
    if (cancelTextBtn) {
      cancelTextBtn.addEventListener('click', () => {
        this.hideModal('text-modal');
      });
    }
    
    // Markup modal buttons
    const saveMarkupBtn = document.getElementById('save-markup');
    if (saveMarkupBtn) {
      saveMarkupBtn.addEventListener('click', () => {
        this.saveMarkup();
        this.hideModal('markup-modal');
      });
    }
    
    const cancelMarkupBtn = document.getElementById('cancel-markup');
    if (cancelMarkupBtn) {
      cancelMarkupBtn.addEventListener('click', () => {
        this.hideModal('markup-modal');
      });
    }
    
    // Markup tools
    this.setupMarkupTools();
    
    // Delete note buttons (event delegation)
    const content = document.getElementById('content');
    if (content) {
      content.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
          const noteId = deleteBtn.dataset.id;
          this.deleteNote(noteId);
        }
      });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadNotes());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
          this.hideModal(modal.id);
        });
      }
    });
  }
  
  setupMarkupTools() {
    const canvas = document.getElementById('markup-canvas');
    if (canvas) {
      this.markupCanvas = canvas;
      this.markupCtx = canvas.getContext('2d');
      
      // Mouse events
      canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
      canvas.addEventListener('mousemove', (e) => this.draw(e));
      canvas.addEventListener('mouseup', () => this.stopDrawing());
      canvas.addEventListener('mouseout', () => this.stopDrawing());
      
      // Touch events
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.startDrawing(e.touches[0]);
      });
      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        this.draw(e.touches[0]);
      });
      canvas.addEventListener('touchend', () => this.stopDrawing());
    }
    
    // Tool selection
    document.querySelectorAll('[data-markup-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.markupTool = btn.dataset.markupTool;
        document.querySelectorAll('[data-markup-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Color selection
    document.querySelectorAll('[data-markup-color]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.markupColor = btn.dataset.markupColor;
        document.querySelectorAll('[data-markup-color]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Undo
    const undoBtn = document.getElementById('undo-markup');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undoMarkup());
    }
    
    // Clear
    const clearBtn = document.getElementById('clear-markup');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearMarkup());
    }
    
    // Save markup
    const saveMarkupBtn = document.getElementById('save-markup');
    if (saveMarkupBtn) {
      saveMarkupBtn.addEventListener('click', () => this.saveMarkup());
    }
  }
  
  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.markupCanvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
    
    // Save state for undo
    this.markupHistory.push(this.markupCanvas.toDataURL());
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.markupCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.markupCtx.strokeStyle = this.markupColor;
    this.markupCtx.lineWidth = this.markupTool === 'pen' ? 3 : 10;
    this.markupCtx.lineCap = 'round';
    this.markupCtx.lineJoin = 'round';
    
    this.markupCtx.beginPath();
    this.markupCtx.moveTo(this.lastX, this.lastY);
    this.markupCtx.lineTo(x, y);
    this.markupCtx.stroke();
    
    this.lastX = x;
    this.lastY = y;
  }
  
  stopDrawing() {
    this.isDrawing = false;
  }
  
  undoMarkup() {
    if (this.markupHistory.length > 0) {
      const lastState = this.markupHistory.pop();
      const img = new Image();
      img.onload = () => {
        this.markupCtx.clearRect(0, 0, this.markupCanvas.width, this.markupCanvas.height);
        this.markupCtx.drawImage(img, 0, 0);
      };
      img.src = lastState;
    }
  }
  
  clearMarkup() {
    this.markupHistory.push(this.markupCanvas.toDataURL());
    this.markupCtx.clearRect(0, 0, this.markupCanvas.width, this.markupCanvas.height);
    
    // Redraw the original photo
    if (this.currentPhoto) {
      const img = new Image();
      img.onload = () => {
        this.markupCtx.drawImage(img, 0, 0, this.markupCanvas.width, this.markupCanvas.height);
      };
      img.src = this.currentPhoto;
    }
  }
  
  async saveMarkup() {
    const dataUrl = this.markupCanvas.toDataURL('image/png');
    
    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'markup',
          photo_data: dataUrl,
        }),
      });
      
      if (response.ok) {
        const note = await response.json();
        this.notes.unshift(note);
        this.renderInbox();
        this.hideModal('markup-modal');
        this.showToast('Photo with markup saved!');
      } else {
        throw new Error('Failed to save markup');
      }
    } catch (error) {
      console.error('Error saving markup:', error);
      this.showToast('Failed to save markup');
    }
  }
  
  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => {
        this.audioChunks.push(e.data);
      };
      
      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.saveAudioNote(audioBlob);
      };
      
      this.mediaRecorder.start();
      
      // Start timer
      this.recordingTime = 0;
      this.recordingTimer = setInterval(() => {
        this.recordingTime += 0.1;
        this.updateRecordingTimer();
      }, 100);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      this.showToast('Failed to access microphone');
    }
  }
  
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Stop microphone stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    // Clear timer
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }
  
  updateRecordingTimer() {
    const mins = Math.floor(this.recordingTime / 60);
    const secs = Math.floor(this.recordingTime % 60);
    document.getElementById('recording-time').textContent = 
      `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  async saveAudioNote(audioBlob) {
    const formData = new FormData();
    formData.append('type', 'audio');
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('duration', (Date.now() - this.recordingStartTime) / 1000);
    
    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const note = await response.json();
        this.notes.unshift(note);
        this.renderInbox();
        this.showToast('Audio note saved!');
      } else {
        throw new Error('Failed to save audio');
      }
    } catch (error) {
      console.error('Error saving audio:', error);
      this.showToast('Failed to save audio note');
    }
  }
  
  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.getElementById('camera-feed');
      video.srcObject = this.stream;
      await video.play();
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.showToast('Failed to access camera');
    }
  }
  
  async capturePhoto() {
    const video = document.getElementById('camera-feed');
    
    if (!this.stream || !video.srcObject) {
      await this.startCamera();
      return;
    }
    
    const canvas = document.getElementById('camera-canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    this.currentPhoto = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera stream
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
    
    // Show markup modal
    this.setupMarkupCanvas(this.currentPhoto);
    this.showModal('markup-modal');
    this.hideModal('camera-modal');
  }
  
  setupMarkupCanvas(photoDataUrl) {
    const canvas = this.markupCanvas;
    const ctx = this.markupCtx;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = photoDataUrl;
    
    this.markupHistory = [];
  }
  
  async handleGalleryPhoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentPhoto = e.target.result;
      this.setupMarkupCanvas(this.currentPhoto);
      this.showModal('markup-modal');
      this.hideModal('camera-modal');
    };
    reader.readAsDataURL(file);
  }
  
  async saveQuickText(text) {
    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          type: 'text',
        }),
      });
      
      if (response.ok) {
        const note = await response.json();
        this.notes.unshift(note);
        this.renderInbox();
        this.showToast('Note saved!');
      } else {
        throw new Error('Failed to save note');
      }
    } catch (error) {
      console.error('Error saving quick text:', error);
      this.showToast('Failed to save note');
    }
  }

  async saveTextNote() {
    const textarea = document.getElementById('note-content');
    const content = textarea.value.trim();
    
    if (!content) {
      this.showToast('Please enter some text');
      return;
    }
    
    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'text',
          content: content,
        }),
      });
      
      if (response.ok) {
        const note = await response.json();
        this.notes.unshift(note);
        this.renderInbox();
        textarea.value = '';
        this.hideModal('text-modal');
        this.showToast('Note saved!');
      } else {
        throw new Error('Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      this.showToast('Failed to save note');
    }
  }
  
  async deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/${noteId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.renderInbox();
        this.showToast('Note deleted');
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      this.showToast('Failed to delete note');
    }
  }
  
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful');
          })
          .catch((error) => {
            console.log('ServiceWorker registration failed:', error);
          });
      });
    }
  }
  
  showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('hidden');
      
      // Start camera if opening camera modal
      if (id === 'camera-modal') {
        this.startCamera();
      }
    }
  }
  
  hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('hidden');
      
      // Stop camera if closing camera modal
      if (id === 'camera-modal' && this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
    }
  }
  
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Navigation ──────────────────────────────────────────

  setupNavigation() {
    const navInbox = document.getElementById('nav-inbox');
    const navJournal = document.getElementById('nav-journal');

    if (navInbox) {
      navInbox.addEventListener('click', () => this.switchView('inbox'));
    }
    if (navJournal) {
      navJournal.addEventListener('click', () => this.switchView('journal'));
    }
  }

  switchView(view) {
    this.currentView = view;
    const content = document.getElementById('content');
    const journalView = document.getElementById('journal-view');
    const navInbox = document.getElementById('nav-inbox');
    const navJournal = document.getElementById('nav-journal');

    if (view === 'inbox') {
      content.classList.remove('hidden');
      journalView.classList.add('hidden');
      navInbox.classList.add('active');
      navJournal.classList.remove('active');
    } else {
      content.classList.add('hidden');
      journalView.classList.remove('hidden');
      navInbox.classList.remove('active');
      navJournal.classList.add('active');
      this.loadJournalView();
    }
  }

  // ── Reflection Capture ──────────────────────────────────

  setupReflection() {
    const reflectBtn = document.getElementById('reflect-btn');
    if (reflectBtn) {
      reflectBtn.addEventListener('click', () => {
        this.showModal('reflect-modal');
        const input = document.getElementById('reflect-input');
        if (input) {
          input.value = '';
          setTimeout(() => input.focus(), 100);
        }
      });
    }

    const saveReflectBtn = document.getElementById('save-reflect');
    if (saveReflectBtn) {
      saveReflectBtn.addEventListener('click', () => {
        const input = document.getElementById('reflect-input');
        if (input && input.value.trim()) {
          this.saveReflection(input.value.trim());
          input.value = '';
          this.hideModal('reflect-modal');
        }
      });
    }

    const cancelReflectBtn = document.getElementById('cancel-reflect');
    if (cancelReflectBtn) {
      cancelReflectBtn.addEventListener('click', () => {
        this.hideModal('reflect-modal');
      });
    }
  }

  async saveReflection(text) {
    // Append #reflection tag if not already present
    const taggedText = text.includes('#reflection') ? text : `${text} #reflection`;

    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taggedText, type: 'text' }),
      });

      if (response.ok) {
        const note = await response.json();
        this.notes.unshift(note);
        this.renderInbox();
        this.showToast('Reflection saved 💭');
      } else {
        throw new Error('Failed to save reflection');
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
      this.showToast('Failed to save reflection');
    }
  }

  // ── Journal View ────────────────────────────────────────

  setupJournal() {
    const saveBtn = document.getElementById('save-journal');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveJournal());
    }

    // Auto-save on pause in typing
    const editor = document.getElementById('journal-editor');
    if (editor) {
      editor.addEventListener('input', () => {
        this.updateJournalStatus('Unsaved changes');
        clearTimeout(this.journalAutoSaveTimer);
        this.journalAutoSaveTimer = setTimeout(() => {
          this.saveJournal();
        }, 3000);
      });
    }
  }

  async loadJournalView() {
    const today = new Date().toISOString().split('T')[0];

    // Set the date header
    const dateEl = document.getElementById('journal-date');
    if (dateEl) {
      const formatted = new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      dateEl.textContent = formatted;
    }

    // Load today's reflections
    await this.loadTodayReflections();

    // Load existing journal entry
    await this.loadJournalEntry(today);
  }

  async loadTodayReflections() {
    try {
      const response = await fetch('/api/reflections/today');
      if (response.ok) {
        const reflections = await response.json();
        this.renderThoughts(reflections);
      }
    } catch (error) {
      console.error('Error loading reflections:', error);
    }
  }

  renderThoughts(reflections) {
    const list = document.getElementById('thoughts-list');
    if (!list) return;

    if (reflections.length === 0) {
      list.innerHTML = `<p class="thoughts-empty">No reflections captured yet today. Use the 💭 button to capture thoughts throughout the day.</p>`;
      return;
    }

    list.innerHTML = reflections.map(r => {
      // Strip the #reflection tag for cleaner display
      const text = (r.content || '').replace(/#reflection/g, '').trim();
      const time = new Date(r.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `
        <div class="thought-card">
          <div class="thought-text">${this.escapeHtml(text)}</div>
          <div class="thought-time">${time}</div>
        </div>
      `;
    }).join('');
  }

  async loadJournalEntry(date) {
    try {
      const response = await fetch(`/api/journal/${date}`);
      if (response.ok) {
        const data = await response.json();
        const editor = document.getElementById('journal-editor');
        if (editor && data.content) {
          // Strip the frontmatter and header to show just the body
          const body = data.content
            .replace(/---[\s\S]*?---\n*/m, '')
            .replace(/^# Journal.*\n*/m, '')
            .trim();
          editor.innerText = body;
        } else if (editor) {
          editor.innerText = '';
        }
        this.updateJournalStatus(data.exists ? 'Loaded' : 'Ready');
      }
    } catch (error) {
      console.error('Error loading journal:', error);
    }
  }

  async saveJournal() {
    const editor = document.getElementById('journal-editor');
    if (!editor) return;

    const content = editor.innerText.trim();
    if (!content) return;

    const today = new Date().toISOString().split('T')[0];
    this.updateJournalStatus('Saving...');

    try {
      const response = await fetch(`/api/journal/${today}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        this.updateJournalStatus('Saved');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving journal:', error);
      this.updateJournalStatus('Save failed');
      this.showToast('Failed to save journal entry');
    }
  }

  updateJournalStatus(text) {
    const status = document.getElementById('journal-status');
    if (status) {
      status.textContent = text;
      status.className = 'journal-status';
      if (text === 'Saved') status.classList.add('saved');
      if (text === 'Saving...') status.classList.add('saving');
    }
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TaskCaptureApp();
});
