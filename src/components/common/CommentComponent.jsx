import React, { useState, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Smile } from 'lucide-react';
import ManageAvatar from './ManageAvatar';

// Added emojis to your suggestions 🚀
const QUICK_MESSAGES = [
    "I'm on it! ⚡", "Looking into this... 👀", "Fixed! ✅",
    "Need logs 📋", "Deployed! 🚀", "Reviewing 🔍",
    "Blocked 🛑", "Re-test please 🧪", "Roadmap 🗺️", "Done! 🏁"
];

const CommentComponent = ({ userData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [commentData, setCommentData] = useState("");
    const scrollRef = useRef(null);

    const slide = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - 200 : scrollLeft + 200;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    const handleQuickMessageClick = (msg) => {
        if (!isEditing) setIsEditing(true);
        setCommentData(prev => prev + `<p>${msg}</p>`);
    };
    console.log("userData", userData)
    return (
        <div className="space-y-4 py-4 max-w-full">
            {/* Custom CSS to override CKEditor Colors */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --ck-color-base-border: #e5e7eb; /* neutral-200 */
                    --ck-color-focus-border: #3b82f6; /* blue-500 */
                    --ck-color-shadow: rgba(59, 130, 246, 0.1);
                    --ck-border-radius: 6px;
                }
                .ck-editor__editable_inline {
                    min-height: 100px;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}} />

            <div className="flex gap-2">
                <ManageAvatar size='sm' firstName={userData?.fist_name} lastName={userData?.last_name} />

                <div className="flex-1 min-w-0 space-y-3">
                    {!isEditing ? (
                        <Card
                            onClick={() => setIsEditing(true)}
                            className="p-3 cursor-pointer hover:bg-neutral-20/400 border-neutral-200 hover:border-neutral-300 shadow-none text-neutral-500 text-sm bg-neutral-100 flex justify-between items-center"
                        >
                            <span>Add a comment...</span>
                            <Smile size={16} className="text-neutral-400" />
                        </Card>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <div className="rounded-md overflow-hidden bg-white shadow-sm ring-1 ring-blue-500/30">
                                <CKEditor
                                    editor={ClassicEditor}
                                    data={commentData}
                                    onReady={editor => editor.focus()}
                                    onChange={(event, editor) => setCommentData(editor.getData())}
                                    config={{
                                        // Standard classic build doesn't include emoji dropdown by default, 
                                        // so we use standard toolbar plus your quick suggestions.
                                        toolbar: ['bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
                                        placeholder: 'Type your message or use suggestions below...'
                                    }}
                                />
                                <div className="flex justify-end gap-2 p-2 bg-neutral-50 border-t border-neutral-200">
                                    <Button variant="default" size="xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button variant="teritary" size="xs" onClick={() => setIsEditing(false)}>Save</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* The Suggestion Slider */}
                    <div className="relative group">
                        <div className="flex items-center">
                            <button
                                onClick={() => slide('left')}
                                className="p-1 hover:bg-neutral-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft size={18} className="text-neutral-600" />
                            </button>

                            <div
                                ref={scrollRef}
                                className="flex gap-2 overflow-x-auto scroll-smooth no-scrollbar py-1 mx-2"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {QUICK_MESSAGES.map((msg, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickMessageClick(msg)}
                                        className="whitespace-nowrap px-3 py-1.5 text-xs rounded-full border border-neutral-200 bg-white hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm shrink-0 flex items-center gap-1"
                                    >
                                        {msg}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => slide('right')}
                                className="p-1 hover:bg-neutral-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight size={18} className="text-neutral-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentComponent;