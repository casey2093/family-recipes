"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Comment } from "@/lib/types";
import { uploadImage } from "@/lib/clientUpload";
import { useAuth } from "@/context/AuthContext";

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  recipeId: string;
}

interface ImagePreview {
  file: File;
  preview: string;
}

export default function CommentsSection({ recipeId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newImages, setNewImages] = useState<ImagePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [replyImages, setReplyImages] = useState<ImagePreview[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [myName, setMyName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  // Sync author name from auth (preferred) or localStorage fallback
  useEffect(() => {
    const name = user?.name ?? localStorage.getItem("wfk_author_name") ?? "";
    setMyName(name);
    setNewAuthor(name);
    setReplyAuthor(name);
    setLikedIds(JSON.parse(localStorage.getItem(`wfk_liked_${recipeId}`) ?? "[]"));
  }, [recipeId, user]);

  useEffect(() => {
    fetch(`/api/comments?recipeId=${recipeId}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(console.error);
  }, [recipeId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, forReply = false) => {
    const files = Array.from(e.target.files ?? []);
    try { e.target.value = ""; } catch { /* iOS Safari */ }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview: ImagePreview = { file, preview: reader.result as string };
        if (forReply) {
          setReplyImages((prev) => (prev.length < 4 ? [...prev, preview] : prev));
        } else {
          setNewImages((prev) => (prev.length < 4 ? [...prev, preview] : prev));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number, forReply = false) => {
    if (forReply) setReplyImages((prev) => prev.filter((_, i) => i !== index));
    else setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newAuthor.trim()) return;
    setSubmitting(true);
    try {
      const uploadedUrls = (
        await Promise.all(newImages.map((img) => uploadImage(img.file)))
      )
        .filter((r) => r.url)
        .map((r) => r.url as string);

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          author: newAuthor.trim(),
          text: newText.trim(),
          imageUrls: uploadedUrls,
        }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewText("");
        setNewImages([]);
        localStorage.setItem("wfk_author_name", newAuthor.trim());
        setMyName(newAuthor.trim());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    const alreadyLiked = likedIds.includes(commentId);
    const action = alreadyLiked ? "unlike" : "like";
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, recipeId, commentId }),
    });
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes: alreadyLiked ? Math.max(0, c.likes - 1) : c.likes + 1 }
          : c
      )
    );
    const updated = alreadyLiked
      ? likedIds.filter((id) => id !== commentId)
      : [...likedIds, commentId];
    setLikedIds(updated);
    localStorage.setItem(`wfk_liked_${recipeId}`, JSON.stringify(updated));
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || !replyAuthor.trim()) return;

    const uploadedUrls = (
      await Promise.all(replyImages.map((img) => uploadImage(img.file)))
    )
      .filter((r) => r.url)
      .map((r) => r.url as string);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reply",
        recipeId,
        commentId,
        author: replyAuthor.trim(),
        text: replyText.trim(),
        imageUrls: uploadedUrls,
      }),
    });
    if (res.ok) {
      const reply = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
        )
      );
      setReplyText("");
      setReplyImages([]);
      setReplyingTo(null);
      localStorage.setItem("wfk_author_name", replyAuthor.trim());
      setMyName(replyAuthor.trim());
    }
  };

  const startDelete = (commentId: string) => {
    setDeletingId(commentId);
    setDeleteConfirmName("");
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const comment = comments.find((c) => c.id === deletingId);
    if (!comment) return;
    if (deleteConfirmName.trim().toLowerCase() !== comment.author.toLowerCase()) {
      setDeleteError("Name doesn't match. Please type your exact name.");
      return;
    }
    await fetch(`/api/comments?recipeId=${recipeId}&commentId=${deletingId}`, {
      method: "DELETE",
    });
    setComments((prev) => prev.filter((c) => c.id !== deletingId));
    setDeletingId(null);
  };

  const openLightbox = (urls: string[], index: number) => setLightbox({ urls, index });
  const closeLightbox = () => setLightbox(null);
  const lightboxPrev = () => setLightbox((lb) => lb && lb.urls.length > 1 ? { ...lb, index: (lb.index - 1 + lb.urls.length) % lb.urls.length } : lb);
  const lightboxNext = () => setLightbox((lb) => lb && lb.urls.length > 1 ? { ...lb, index: (lb.index + 1) % lb.urls.length } : lb);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") lightboxPrev();
      else if (e.key === "ArrowRight") lightboxNext();
      else if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox]);

  const allImages = (comment: Comment) => [
    ...(comment.imageUrls ?? []),
    ...(comment.imageUrl && !comment.imageUrls?.length ? [comment.imageUrl] : []),
  ];

  return (
    <div className="mx-6 mb-6">
      <h3 className="font-playfair font-bold text-recipe-navy text-xl mb-4 pt-5 border-t-2 border-recipe-cream">
        Comments{" "}
        {comments.length > 0 && (
          <span className="text-gray-400 text-base font-normal">({comments.length})</span>
        )}
      </h3>

      {/* Comment list */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No comments yet — be the first!
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-recipe-cream rounded-2xl p-4">
            {/* Delete confirmation inline */}
            {deletingId === comment.id && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm">
                <p className="font-semibold text-red-700 mb-2">
                  Type your name to delete this comment
                </p>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => { setDeleteConfirmName(e.target.value); setDeleteError(""); }}
                  placeholder="Your name"
                  className="w-full border border-red-300 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-red-500 bg-white"
                />
                {deleteError && <p className="text-red-600 text-xs mb-2">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={confirmDelete}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="text-gray-500 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <Link href={`/author/${encodeURIComponent(comment.author)}`}>
                <div className="w-7 h-7 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold flex-shrink-0 hover:opacity-80">
                  {comment.author.charAt(0).toUpperCase()}
                </div>
              </Link>
              <Link
                href={`/author/${encodeURIComponent(comment.author)}`}
                className="font-bold text-recipe-navy text-sm hover:text-recipe-pink"
              >
                {comment.author}
              </Link>
              <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
              {myName && comment.author.toLowerCase() === myName.toLowerCase() && deletingId !== comment.id && (
                <button
                  onClick={() => startDelete(comment.id)}
                  className="ml-auto text-gray-300 hover:text-red-400 transition-colors"
                  title="Delete comment"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-2 leading-relaxed">{comment.text}</p>

            {allImages(comment).length > 0 && (
              <div className={`grid gap-2 mb-2 ${allImages(comment).length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
                {allImages(comment).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="Comment image" className="rounded-xl w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openLightbox(allImages(comment), i)} />
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => handleLike(comment.id)}
                className={`flex items-center gap-1 font-semibold transition-colors ${
                  likedIds.includes(comment.id)
                    ? "text-recipe-pink"
                    : "text-gray-400 hover:text-recipe-pink"
                }`}
              >
                ♥{comment.likes > 0 && ` ${comment.likes}`}
              </button>
              <button
                onClick={() => {
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                  setReplyImages([]);
                }}
                className="text-gray-400 hover:text-recipe-navy font-semibold"
              >
                Reply
              </button>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                {user ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm">
                    <div className="w-5 h-5 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-recipe-navy">{user.name}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={replyAuthor}
                    onChange={(e) => setReplyAuthor(e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-recipe-navy bg-white"
                  />
                )}
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-recipe-navy bg-white resize-none"
                />
                {replyImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {replyImages.map((img, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                        <button
                          onClick={() => removeImage(i, true)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    className="text-xs text-gray-500 hover:text-recipe-navy flex items-center gap-1 font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Photo
                  </button>
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageChange(e, true)}
                  />
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="ml-auto bg-recipe-navy text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-opacity-90"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            {comment.replies.length > 0 && (
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-200">
                {comment.replies.map((reply) => (
                  <div key={reply.id}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link
                        href={`/author/${encodeURIComponent(reply.author)}`}
                        className="font-bold text-recipe-navy text-xs hover:text-recipe-pink"
                      >
                        {reply.author}
                      </Link>
                      <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{reply.text}</p>
                    {reply.imageUrls && reply.imageUrls.length > 0 && (
                      <div className={`grid gap-1.5 mt-1.5 ${reply.imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-[12rem]"}`}>
                        {reply.imageUrls.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={url} alt="Reply image" className="rounded-lg w-full max-h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openLightbox(reply.imageUrls ?? [], i)} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New comment form */}
      <div className="bg-recipe-cream rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold text-recipe-navy">Leave a comment</p>
        {user ? (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
            <div className="w-5 h-5 rounded-full bg-recipe-rose flex items-center justify-center text-recipe-pink text-xs font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-recipe-navy">{user.name}</span>
          </div>
        ) : (
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Your name"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy bg-white"
          />
        )}
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Share your thoughts, memories, or tips…"
          rows={3}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy bg-white resize-none"
        />

        {newImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {newImages.map((img, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.preview} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-gray-500 hover:text-recipe-navy flex items-center gap-1.5 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImageChange(e)}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !newText.trim() || !newAuthor.trim()}
            className="bg-recipe-pink text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </div>
      {/* Image lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors text-lg"
          >
            ✕
          </button>

          {lightbox.urls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/35 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.urls[lightbox.index]}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {lightbox.urls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/35 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {lightbox.urls.length > 1 && (
            <div className="absolute bottom-5 flex gap-2">
              {lightbox.urls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: i } : lb); }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightbox.index ? "bg-white" : "bg-white/40 hover:bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
