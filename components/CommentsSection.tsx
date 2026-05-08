"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Comment } from "@/lib/types";

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

async function uploadImage(file: File): Promise<string | undefined> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) return undefined;
    return (await res.json()).url;
  } catch {
    return undefined;
  }
}

interface Props {
  recipeId: string;
}

export default function CommentsSection({ recipeId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNewAuthor(localStorage.getItem("wfk_author_name") ?? "");
    setReplyAuthor(localStorage.getItem("wfk_author_name") ?? "");
    setLikedIds(JSON.parse(localStorage.getItem(`wfk_liked_${recipeId}`) ?? "[]"));
  }, [recipeId]);

  useEffect(() => {
    fetch(`/api/comments?recipeId=${recipeId}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(console.error);
  }, [recipeId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setNewImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newAuthor.trim()) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (newImageFile) imageUrl = await uploadImage(newImageFile);

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, author: newAuthor.trim(), text: newText.trim(), imageUrl }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewText("");
        setNewImageFile(null);
        setNewImagePreview(null);
        localStorage.setItem("wfk_author_name", newAuthor.trim());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (likedIds.includes(commentId)) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", recipeId, commentId }),
    });
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
    );
    const updated = [...likedIds, commentId];
    setLikedIds(updated);
    localStorage.setItem(`wfk_liked_${recipeId}`, JSON.stringify(updated));
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim() || !replyAuthor.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reply",
        recipeId,
        commentId,
        author: replyAuthor.trim(),
        text: replyText.trim(),
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
      setReplyingTo(null);
      localStorage.setItem("wfk_author_name", replyAuthor.trim());
    }
  };

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
            </div>

            <p className="text-sm text-gray-700 mb-2 leading-relaxed">{comment.text}</p>

            {comment.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.imageUrl}
                alt="Comment image"
                className="rounded-xl max-h-48 object-cover mb-2"
              />
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
                onClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
                className="text-gray-400 hover:text-recipe-navy font-semibold"
              >
                Reply
              </button>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  placeholder="Your name"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-recipe-navy bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-recipe-navy bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleReply(comment.id);
                    }}
                  />
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="bg-recipe-navy text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-opacity-90"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            {comment.replies.length > 0 && (
              <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
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
        <input
          type="text"
          value={newAuthor}
          onChange={(e) => setNewAuthor(e.target.value)}
          placeholder="Your name"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy bg-white"
        />
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Share your thoughts, memories, or tips…"
          rows={3}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-recipe-navy bg-white resize-none"
        />

        {newImagePreview && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={newImagePreview} alt="Preview" className="h-24 rounded-xl object-cover" />
            <button
              onClick={() => { setNewImageFile(null); setNewImagePreview(null); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center"
            >
              ✕
            </button>
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
            Add photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
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
    </div>
  );
}
