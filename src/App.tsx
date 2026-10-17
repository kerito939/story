import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Flame,
  ImagePlus,
  Languages,
  Menu,
  MessageCircle,
  MoreVertical,
  Play,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

type Story = {
  id: string;
  title: string;
  category: string;
  about: string;
  starting_chat: string;
  play_guide: string;
  language: string;
  cover_image: string | null;
  created_at: string;
};

type ChatMessage = { id: string; text: string; role: 'ai' | 'user' | 'system'; italic?: boolean };

type RoleplayModel = {
  id: string;
  name: string;
  format: string;
  size_bytes: number;
  storage_path: string;
  is_active: boolean;
  created_at: string;
};

type StoryForm = {
  title: string;
  category: string;
  about: string;
  starting_chat: string;
  play_guide: string;
  language: string;
  cover_image: string | null;
};

const defaultCover = 'https://images.pexels.com/photos/34919535/pexels-photo-34919535.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const covers = [
  defaultCover,
  'https://images.pexels.com/photos/25651622/pexels-photo-25651622.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/24734671/pexels-photo-24734671.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/37114303/pexels-photo-37114303.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const starterStories: Story[] = [
  {
    id: 'black-dragon', title: 'Black Dragon', category: 'Fantasy · Adventure',
    about: 'A cursed dragon prince guards a forgotten kingdom. You are the only human who can hear his true voice.',
    starting_chat: '*Thunder rolls over the black mountains. A pair of ember eyes opens in the dark.*\n\nKael: “You should not have come here, little wanderer.”',
    play_guide: 'Stay curious, brave, and let the dragon reveal the truth behind the curse.', language: 'English', cover_image: defaultCover, created_at: new Date().toISOString(),
  },
  {
    id: 'midnight-detective', title: 'Midnight Detective', category: 'Mystery · Drama',
    about: 'Rain, secrets, and one case that brings two strangers together in an empty city.',
    starting_chat: '*The city is quiet except for rain tapping against the window.*\n\nAva: “If you are here, then you already know someone is watching us.”',
    play_guide: 'Ask questions, follow clues, and never trust the first answer.', language: 'Hindi', cover_image: covers[1], created_at: new Date().toISOString(),
  },
  {
    id: 'red-moon', title: 'Under The Red Moon', category: 'Romance · Fantasy',
    about: 'A moonlit promise, a mysterious stranger, and a village that forgets every sunrise.',
    starting_chat: '*The red moon paints the balcony crimson. Someone waits behind the curtain.*\n\nNoor: “Tell me you remember me this time.”',
    play_guide: 'Build trust slowly and choose your words with care.', language: 'English', cover_image: covers[2], created_at: new Date().toISOString(),
  },
  {
    id: 'last-wish', title: 'The Last Wish', category: 'Drama · Slow burn',
    about: 'One final wish can change the past, but the person who grants it wants something in return.',
    starting_chat: '*Three candles flicker around an old silver mirror.*\n\nRhea: “Say my name, and I will give you one chance to rewrite everything.”',
    play_guide: 'Keep the mood emotional, cinematic, and full of meaningful choices.', language: 'English', cover_image: covers[3], created_at: new Date().toISOString(),
  },
];

const emptyForm: StoryForm = { title: '', category: 'Roleplay', about: '', starting_chat: '', play_guide: '', language: 'English', cover_image: null };
const maxModelBytes = 50 * 1024 * 1024;
const resumableUploadThreshold = 6 * 1024 * 1024;

function App() {
  const [screen, setScreen] = useState<'home' | 'chat'>('home');
  const [activeTab, setActiveTab] = useState('For you');
  const [stories, setStories] = useState<Story[]>(starterStories);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [form, setForm] = useState<StoryForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [storyError, setStoryError] = useState('');
  const [loadingStories, setLoadingStories] = useState(true);
  const [models, setModels] = useState<RoleplayModel[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const activeModel = models.find((model) => model.is_active) || models[0] || null;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadingStories(false);
      return;
    }
    let active = true;
    async function loadStories() {
      const { data, error } = await supabase.from('roleplay_stories').select('*').order('created_at', { ascending: false });
      if (active && !error && data?.length) setStories([...data, ...starterStories]);
      if (active) setLoadingStories(false);
    }
    async function loadModels() {
      const { data } = await supabase.from('roleplay_models').select('*').order('created_at', { ascending: false });
      if (active && data) setModels(data);
    }
    loadStories();
    loadModels();
    return () => { active = false; };
  }, []);

  const visibleStories = useMemo(() => activeTab === 'New' ? [...stories].reverse() : stories, [activeTab, stories]);

  function openStory(story: Story) {
    setSelectedStory(story);
    setScreen('chat');
  }

  async function selectModel(model: RoleplayModel) {
    const { error } = await supabase.from('roleplay_models').update({ is_active: false }).neq('id', model.id);
    if (error) return;
    const { error: activateError } = await supabase.from('roleplay_models').update({ is_active: true }).eq('id', model.id);
    if (!activateError) setModels((current) => current.map((item) => ({ ...item, is_active: item.id === model.id })));
  }

  async function deleteModel(model: RoleplayModel) {
    const { error } = await supabase.storage.from('roleplay-models').remove([model.storage_path]);
    if (error) return;
    const { error: deleteError } = await supabase.from('roleplay_models').delete().eq('id', model.id);
    if (!deleteError) setModels((current) => current.filter((item) => item.id !== model.id));
  }

  async function deleteStory(id: string) {
    if (id.startsWith('black-') || id.startsWith('midnight-') || id.startsWith('red-') || id.startsWith('last-')) return;
    const { error } = await supabase.from('roleplay_stories').delete().eq('id', id);
    if (!error) setStories((current) => current.filter((story) => story.id !== id));
  }

  async function saveStory(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.about.trim()) {
      setStoryError('Story name and about story are required.');
      return;
    }
    setIsSaving(true);
    setStoryError('');
    const { data, error } = await supabase.from('roleplay_stories').insert({ ...form, title: form.title.trim(), about: form.about.trim() }).select().maybeSingle();
    if (error || !data) {
      setStoryError('Story could not be saved right now. Please try again.');
      setIsSaving(false);
      return;
    }
    setStories((current) => [data, ...current]);
    setShowCreator(false);
    setForm(emptyForm);
    setIsSaving(false);
  }

  if (screen === 'chat' && selectedStory) {
    return <ChatScreen story={selectedStory} model={activeModel} onBack={() => setScreen('home')} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><Sparkles size={18} strokeWidth={2.5} /><span>kavana</span></div>
        <button className="model-trigger" onClick={() => setShowModelPicker(true)}><Sparkles size={15} /><span>{activeModel ? activeModel.name : 'Add AI model'}</span><ChevronDown size={15} /></button>
        <div className="profile-actions"><div className="streak"><Flame size={17} fill="currentColor" /> <b>3</b></div><div className="profile-avatar">K</div><Menu size={22} /></div>
      </header>
      <nav className="category-tabs" aria-label="Story categories">
        {['For you', 'New', 'By Fans', 'Top 10', 'Anime'].map((tab) => <button className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}
      </nav>
      <main className="home-content">
        <section className="continue-section">
          <div className="section-heading"><h1>Continue Chat</h1><button className="text-button">See all <ChevronRight size={16} /></button></div>
          <div className="continue-list">{stories.slice(0, 5).map((story) => <button className="continue-card" key={story.id} onClick={() => openStory(story)}><div className="round-cover" style={{ backgroundImage: `url(${story.cover_image || defaultCover})` }}><span className="online-dot" /></div><span>{story.title}</span></button>)}</div>
        </section>
        <section>
          <div className="section-heading"><div><h2>{activeTab === 'New' ? 'New Stories' : 'New Release'}</h2><p>Stories made for your next obsession</p></div><button className="create-button" onClick={() => setShowCreator(true)}><Plus size={19} /> Create</button></div>
          {loadingStories && <div className="loading-line">Finding your stories...</div>}
          <div className="story-grid">{visibleStories.map((story) => <StoryCard key={story.id} story={story} onOpen={() => openStory(story)} onDelete={() => deleteStory(story.id)} />)}<button className="add-story-card" onClick={() => setShowCreator(true)}><div><Plus size={28} /></div><span>Create your own story</span><small>Turn any idea into a roleplay</small></button></div>
        </section>
      </main>
      <footer className="bottom-nav"><button className="selected"><Sparkles size={22} fill="currentColor" /><span>Home</span></button><button><span className="nav-search" /><span>Search</span></button><button><MessageCircle size={23} /><span>Chats</span></button><button onClick={() => setShowCreator(true)}><div className="coin-icon">k</div><span>Store</span></button></footer>
      {showCreator && <StoryCreator form={form} setForm={setForm} error={storyError} saving={isSaving} onClose={() => { setShowCreator(false); setStoryError(''); }} onSubmit={saveStory} />}
      {showModelPicker && <ModelPicker models={models} activeModel={activeModel} onClose={() => setShowModelPicker(false)} onSelect={selectModel} onDelete={deleteModel} onUploaded={(model) => { setModels((current) => [model, ...current.map((item) => ({ ...item, is_active: false }))]); }} />}
    </div>
  );
}

function StoryCard({ story, onOpen, onDelete }: { story: Story; onOpen: () => void; onDelete: () => void }) {
  return <article className="story-card"><button className="story-cover-button" onClick={onOpen}><img src={story.cover_image || defaultCover} alt="" /><span className="chat-count"><MessageCircle size={13} /> {story.id.startsWith('black-') ? '12.4K' : '2.8K'}</span><span className="play-overlay"><Play size={17} fill="currentColor" /></span></button><div className="story-card-body"><div><h3>{story.title}</h3><p>{story.category}</p></div><button className="delete-story" onClick={onDelete} aria-label={`Delete ${story.title}`}><Trash2 size={16} /></button></div></article>;
}

function StoryCreator({ form, setForm, error, saving, onClose, onSubmit }: { form: StoryForm; setForm: (form: StoryForm) => void; error: string; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  function update(field: keyof StoryForm, value: string | null) { setForm({ ...form, [field]: value }); }
  function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('cover_image', typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="creator-panel" onSubmit={onSubmit}><div className="panel-head"><div><span className="eyebrow">Your universe</span><h2>Create a story</h2></div><button type="button" onClick={onClose} className="close-button"><X size={20} /></button></div><div className="creator-scroll"><div className="upload-zone" style={form.cover_image ? { backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(8,8,10,.92)), url(${form.cover_image})` } : undefined}><div className="upload-copy">{form.cover_image ? <><span>Cover selected</span><button type="button" onClick={() => update('cover_image', null)} className="remove-cover"><Trash2 size={15} /> Remove</button></> : <><ImagePlus size={25} /><span>Add a story cover</span><small>JPG or PNG, shown on your story card</small></>} </div><input ref={fileRef} type="file" accept="image/*" onChange={onUpload} hidden />{!form.cover_image && <button type="button" className="upload-button" onClick={() => fileRef.current?.click()}><Upload size={15} /> Upload image</button>}</div><label>Story name<input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Black Dragon" /></label><div className="two-fields"><label>Genre<input value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Fantasy · Adventure" /></label><label>Chat language<select value={form.language} onChange={(event) => update('language', event.target.value)}><option>English</option><option>Hindi</option><option>Hinglish</option></select></label></div><label>About story<textarea value={form.about} onChange={(event) => update('about', event.target.value)} placeholder="Tell the AI what this world is about..." rows={3} /></label><label>Starting chat<textarea value={form.starting_chat} onChange={(event) => update('starting_chat', event.target.value)} placeholder="*The scene opens...*\n\nCharacter: &quot;Welcome...&quot;" rows={4} /></label><label>Play guide <span className="optional">optional</span><textarea value={form.play_guide} onChange={(event) => update('play_guide', event.target.value)} placeholder="How should the roleplay feel?" rows={3} /></label>{error && <p className="form-error">{error}</p>}</div><button className="primary-button" disabled={saving}>{saving ? 'Saving story...' : 'Create story'}<ChevronRight size={19} /></button></form></div>;
}

function encodeUploadMetadata(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

async function uploadModelFile(file: File, storagePath: string, onProgress: (loaded: number, total: number) => void): Promise<void> {
  const contentType = file.type || 'application/octet-stream';
  if (file.size <= resumableUploadThreshold) {
    const { error } = await supabase.storage.from('roleplay-models').upload(storagePath, file, { contentType, upsert: false });
    if (error) throw new Error('small upload failed');
    onProgress(file.size, file.size);
    return;
  }
  const response = await fetch(`${supabaseUrl}/storage/v1/upload/resumable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(file.size),
      'Upload-Metadata': [
        `bucketName ${encodeUploadMetadata('roleplay-models')}`,
        `objectName ${encodeUploadMetadata(storagePath)}`,
        `contentType ${encodeUploadMetadata(contentType)}`,
      ].join(','),
    },
  });
  if (!response.ok) throw new Error(`upload session failed (${response.status})`);
  const location = response.headers.get('Location');
  if (!location) throw new Error('upload session missing location');

  const chunkSize = 6 * 1024 * 1024;
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
    const loaded = await new Promise<number>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PATCH', location);
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Tus-Resumable', '1.0.0');
      xhr.setRequestHeader('Upload-Offset', String(offset));
      xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
      xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
        if (event.lengthComputable) onProgress(offset + event.loaded, file.size);
      };
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(Number(xhr.getResponseHeader('Upload-Offset') || offset + chunk.size)) : reject(new Error(`upload chunk failed (${xhr.status})`));
      xhr.onerror = () => reject(new Error('upload chunk failed'));
      xhr.send(chunk);
    });
    offset = loaded;
    onProgress(offset, file.size);
  }
}

function ModelPicker({ models, activeModel, onClose, onSelect, onDelete, onUploaded }: { models: RoleplayModel[]; activeModel: RoleplayModel | null; onClose: () => void; onSelect: (model: RoleplayModel) => void; onDelete: (model: RoleplayModel) => void; onUploaded: (model: RoleplayModel) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  async function uploadModel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['gguf', 'safetensors', 'bin'].includes(extension)) { setError('Use a GGUF, SafeTensors, or BIN model file.'); return; }
    if (file.size > maxModelBytes) { setError('This preview accepts model files up to 50 MB. Choose a smaller GGUF, BIN, or SafeTensors file.'); return; }
    if (!isSupabaseConfigured) { setError('Storage is not connected in this preview.'); return; }
    setUploading(true); setError(''); setUploadProgress(0); setUploadedBytes(0); setUploadTotal(file.size);
    const storagePath = `global/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    try {
      await uploadModelFile(file, storagePath, (loaded: number, total: number) => { setUploadedBytes(loaded); setUploadTotal(total); setUploadProgress(Math.round((loaded / total) * 100)); });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setError(message.includes('413') ? 'This model is larger than the storage limit. Choose a file up to 50 MB.' : 'Model upload failed. Please try again.');
      setUploading(false);
      return;
    }
    await supabase.from('roleplay_models').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    const { data, error: insertError } = await supabase.from('roleplay_models').insert({ name: file.name, format: extension.toUpperCase(), size_bytes: file.size, storage_path: storagePath, is_active: true }).select().maybeSingle();
    if (insertError || !data) { await supabase.storage.from('roleplay-models').remove([storagePath]); setError('Model record could not be saved. Please try again.'); setUploading(false); return; }
    onUploaded(data); setUploading(false);
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="model-panel"><div className="panel-head"><div><span className="eyebrow">Global intelligence</span><h2>AI model</h2></div><button type="button" onClick={onClose} className="close-button"><X size={20} /></button></div><div className="model-panel-body"><div className="model-note"><Sparkles size={19} /><p>Upload one model and it becomes available to every story chat. Messages only send when a real model service is connected.</p></div>{models.length === 0 && <div className="empty-model"><Upload size={24} /><strong>No model uploaded</strong><span>Add your GGUF light model, like a 0.5B file.</span></div>}{models.map((model) => <div className={`model-row ${activeModel?.id === model.id ? 'selected' : ''}`} key={model.id}><div className="model-symbol"><Sparkles size={17} /></div><div className="model-meta"><strong>{model.name}</strong><span>{model.format} · {formatBytes(model.size_bytes)}{model.is_active ? ' · Active for all stories' : ''}</span></div><button className="model-select" onClick={() => onSelect(model)}>{model.is_active ? 'Active' : 'Use'}</button><button className="delete-story" onClick={() => onDelete(model)} aria-label={`Delete ${model.name}`}><Trash2 size={16} /></button></div>)}<input ref={inputRef} type="file" accept=".gguf,.safetensors,.bin" hidden onChange={uploadModel} />{error && <p className="form-error">{error}</p>}{uploading && <div className="upload-progress"><div className="upload-progress-label"><span>Uploading model</span><strong>{uploadProgress}%</strong></div><div className="upload-progress-track"><span style={{ width: `${uploadProgress}%` }} /></div><small>{formatBytes(uploadedBytes)} / {formatBytes(uploadTotal)}</small></div>}<button className="upload-model-button" onClick={() => inputRef.current?.click()} disabled={uploading}><Upload size={17} /> {uploading ? `${uploadProgress}% uploading...` : 'Upload model file'}</button>{models.length > 0 && !uploading && <p className="model-saved-note">Your uploaded model stays in the app until you choose Delete.</p>}<p className="model-runtime-note">GGUF upload is stored securely. To generate real replies, this app still needs a GGUF-compatible server or AI provider connected to the chat service.</p></div></div></div>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024 * 1024) >= 1 ? bytes / (1024 * 1024 * 1024) : bytes / (1024 * 1024)).toFixed(1)} ${bytes / (1024 * 1024 * 1024) >= 1 ? 'GB' : 'MB'}`;
}

function ChatScreen({ story, model, onBack }: { story: Story; model: RoleplayModel | null; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ id: 'start', text: story.starting_chat || `*${story.title} begins in the quiet before dawn.*`, role: 'ai', italic: true }]);
  const [draft, setDraft] = useState('');
  const [language, setLanguage] = useState(story.language);
  const [showGuide, setShowGuide] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState('');
  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || isThinking) return;
    const text = draft.trim();
    setDraft(''); setChatError(''); setMessages((current) => [...current, { id: `${Date.now()}-user`, text, role: 'user' }]); setIsThinking(true);
    const { data, error } = await supabase.functions.invoke('roleplay-chat', { body: { story, model, message: text, language } });
    if (error || !data?.reply || typeof data.reply !== 'string') setChatError('Real AI is not connected yet. Connect a GGUF-compatible chat service to start this conversation.');
    else setMessages((current) => [...current, { id: `${Date.now()}-ai`, text: data.reply, role: 'ai' }]);
    setIsThinking(false);
  }
  return <div className="chat-shell"><header className="chat-header"><button onClick={onBack} className="icon-button"><ArrowLeft size={24} /></button><div className="chat-title"><div className="mini-cover" style={{ backgroundImage: `url(${story.cover_image || defaultCover})` }}><span /></div><div><h1>{story.title}</h1><p>Roleplay · {model ? `${model.format} model` : 'add AI model'}</p></div></div><div className="header-actions"><button className="icon-button" onClick={() => setLanguage(language === 'English' ? 'Hindi' : 'English')}><Languages size={20} /></button><MoreVertical size={22} /></div></header><main className="chat-area"><div className="powered"><Sparkles size={14} /> Powered by AI</div><div className="about-card"><div className="image-strip">{[story.cover_image || defaultCover, covers[1], covers[2]].map((image) => <img src={image} alt="" key={image} />)}</div><div className="about-content"><span className="eyebrow">About story</span><p>{story.about}</p><span className="cost-pill"><span className="coin-icon small">k</span> 0.5 / message</span></div></div>{messages.map((message) => <div className={`message ${message.role} ${message.italic ? 'italic' : ''}`} key={message.id}>{message.text}</div>)}<button className="play-button" onClick={() => setShowGuide(!showGuide)}><Play size={18} fill="currentColor" /> <span>{showGuide ? 'Pause guide' : 'Play guide'}</span></button>{showGuide && <div className="guide-card"><div className="guide-title"><CircleHelp size={18} /> Play guide</div><p>{story.play_guide || 'Stay in character, make bold choices, and let the story surprise you.'}</p></div>}</main><div className="chat-composer-wrap"><div className="coin-bar"><span><span className="coin-icon small">k</span> 9 messages left</span><button>Buy Coins <span className="coin-icon small">k</span></button></div><form className="composer" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Write in ${language}...`} /><button type="button" className="composer-icon"><Sparkles size={21} /></button><button type="submit" className="send-button"><Send size={19} /></button></form>{isThinking && <div className="chat-status">Waiting for the connected AI model...</div>}{chatError && <div className="chat-error">{chatError}</div>}<div className="language-hint"><Languages size={13} /> {language} chat · switch with the top icon</div></div></div>;
}

export default App;
