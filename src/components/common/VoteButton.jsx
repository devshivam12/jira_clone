import React from 'react'
import { Button } from '../ui/button';
import { ChevronDown, ThumbsUp } from 'lucide-react';
import CommonDropdownMenu from './CommonDropdownMenu';

const VoteButton = ({
    vote,
    voteDetail,
    isVoteLoading,
    onToggleVote,
    onOpenDropdown
}) => {
    return (
        <div className="flex items-center gap-1">
            {/* Toggle Vote */}
            <Button
                type="button"
                size="sm"
                variant={vote?.hasVoted ? "teritary" : "default"}
                aria-pressed={vote?.hasVoted}
                aria-label={vote?.hasVoted ? "Remove vote" : "Add vote"}
                onClick={onToggleVote}
                disabled={isVoteLoading}
                className={`flex items-center gap-2 rounded-r-none border-r-0 ${vote?.hasVoted ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : ""
                    }`}
            >
                <ThumbsUp size={16} />
                <span className="text-sm font-medium">
                    {vote?.hasVoted ? "Voted" : "Vote"}{" "}
                    {vote?.count > 0 && `(${vote.count})`}
                </span>
            </Button>

            {/* Dropdown with voters */}
            {vote?.count > 0 && (
                <CommonDropdownMenu
                    triggerIcon={
                        <Button
                            variant={vote?.hasVoted ? "secondary" : "outline"}
                            size="icon"
                            type="button"
                            aria-label="Show voters"
                        >
                            <ChevronDown size={16} />
                        </Button>
                    }
                    items={voteDetail}
                    onOpenChange={onOpenDropdown}
                />
            )}
        </div>
    );
};

export default VoteButton
