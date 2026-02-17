import React from 'react';
import { Plus, Info } from 'lucide-react';

const BookSearchItem = ({ book, onSelect, onInfo }) => {
    return (
        <div
            className="flex items-center p-3 hover:bg-[#F8F6F1] active:bg-[#F4F1EA] transition-colors rounded-lg cursor-pointer group"
            onClick={() => onSelect(book)}
        >
            <div className="w-12 h-16 flex-shrink-0 bg-[#E8E3D9] rounded overflow-hidden mr-4 shadow-sm">
                {book.cover_url ? (
                    <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#9B948B]">
                        <Plus className="w-4 h-4 opacity-50" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[#2C2A27] truncate text-sm">
                    {book.title}
                </h4>
                <p className="text-xs text-[#6A645C] truncate">
                    {book.authors.join(', ')}
                </p>
                <div className="flex items-center mt-1 space-x-2">
                    {book.categories && book.categories[0] && (
                        <span className="text-[10px] uppercase tracking-wider text-[#A68A64] font-medium bg-[#F4F1EA] px-1.5 py-0.5 rounded">
                            {book.categories[0]}
                        </span>
                    )}
                    {book.published_date && (
                        <span className="text-[10px] text-[#9B948B]">
                            {book.published_date.split('-')[0]}
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onInfo(book);
                }}
                className="p-2 text-[#9B948B] hover:text-[#A68A64] transition-colors"
            >
                <Info className="w-4 h-4" />
            </button>
        </div>
    );
};

export default BookSearchItem;
