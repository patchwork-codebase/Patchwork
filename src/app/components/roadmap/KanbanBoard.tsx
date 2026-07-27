import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../auth/AuthContext';
import { useRoadmapItems, useCreateRoadmapItem, useUpdateRoadmapItem, useDeleteRoadmapItem, RoadmapItem } from '../../hooks/useRoadmap';
import { Loader2, Plus, GripVertical, Calendar, Trash2, MessageSquare, Flag, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { RoadmapItemModal } from './RoadmapItemModal';
import { UserAvatar } from '../ui/UserAvatar';
import { format } from 'date-fns';

// --- Sortable Item Component ---
function SortableItem({ id, item, onDelete }: { id: string; item: RoadmapItem; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id, data: { type: 'Item', item } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      whileHover={isDragging ? undefined : { scale: 1.02, y: -2 }}
      className={`bg-[#151A27] p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col gap-3 relative group hover:shadow-lg hover:border-primary-500/50 transition-all cursor-pointer ${isDragging ? 'cursor-grabbing shadow-2xl scale-105 border-primary-500 rotate-2 ring-4 ring-primary-500/20' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between">
        <h4 className="font-bold text-white text-[14px] leading-tight pr-6">{item.title}</h4>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-4 cursor-grab text-slate-400">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      {item.description && (
        <p className="text-[12px] text-slate-400 line-clamp-2">{item.description}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {item.labels?.map(label => (
          <span key={label} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
          {item.sprint_id ? (
             <span className="flex items-center gap-1 text-primary-400 bg-primary-400/10 px-2 py-0.5 rounded-full">
               <Calendar className="w-3 h-3" /> Sprint
             </span>
          ) : null}
          
          {item.due_date && (
            <span className="flex items-center gap-1" title="Due Date">
              <Clock className="w-3 h-3" /> {format(new Date(item.due_date), 'MMM d')}
            </span>
          )}

          {item.priority && (
            <span className={`flex items-center gap-1 ${item.priority === 'urgent' ? 'text-rose-500' : item.priority === 'high' ? 'text-orange-500' : ''}`} title={`Priority: ${item.priority}`}>
              <Flag className="w-3 h-3" />
            </span>
          )}

          {item.roadmap_comments && item.roadmap_comments[0]?.count > 0 && (
            <span className="flex items-center gap-1" title="Comments">
              <MessageSquare className="w-3 h-3" /> {item.roadmap_comments[0].count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.roadmap_assignees && item.roadmap_assignees.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden mr-1">
              {item.roadmap_assignees.map(a => (
                <div key={a.user_id} className="relative inline-block rounded-full ring-1 ring-[#151A27]">
                  <UserAvatar userId={a.user_id} avatarUrl={a.users.avatar} name={a.users.name} className="w-5 h-5 rounded-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(item.id);
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 rounded-lg relative z-10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Droppable Column Component ---
function DroppableColumn({ id, children, bgClass }: { id: string; children: React.ReactNode, bgClass: string }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex-1 flex flex-col gap-3 min-h-[150px] p-3 rounded-3xl transition-colors ${bgClass}`}>
      {children}
    </div>
  );
}

// --- Main Kanban Component ---
export function KanbanBoard() {
  const { user } = useAuth();
  const builderId = user?.id || '';
  
  const { data: items, isLoading } = useRoadmapItems(builderId);
  const { mutateAsync: updateItem } = useUpdateRoadmapItem();
  const { mutateAsync: createItem } = useCreateRoadmapItem();
  const { mutateAsync: deleteItem } = useDeleteRoadmapItem();
  
  const [columns, setColumns] = useState<{ [key: string]: RoadmapItem[] }>({
    now: [],
    next: [],
    later: [],
    completed: []
  });
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [addingToCol, setAddingToCol] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem({ id: itemId });
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const [searchParams] = useSearchParams();
  const ticketIdParam = searchParams.get('ticketId') || searchParams.get('itemId');

  useEffect(() => {
    if (items) {
      setColumns({
        now: items.filter(i => i.status === 'now').sort((a, b) => a.position - b.position),
        next: items.filter(i => i.status === 'next').sort((a, b) => a.position - b.position),
        later: items.filter(i => i.status === 'later').sort((a, b) => a.position - b.position),
        completed: items.filter(i => i.status === 'completed').sort((a, b) => a.position - b.position)
      });

      if (ticketIdParam) {
        const targetItem = items.find(i => i.id === ticketIdParam);
        if (targetItem) {
          setSelectedItem(targetItem);
        }
      }
    }
  }, [items, ticketIdParam]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Item';
    const isOverTask = over.data.current?.type === 'Item';
    const isOverColumn = ['now', 'next', 'later', 'completed'].includes(overId);

    if (!isActiveTask) return;

    const activeItem = active.data.current.item as RoadmapItem;
    const activeColumn = activeItem.status;

    setColumns((prev) => {
      let overColumn = overId;
      if (isOverTask) {
        overColumn = over.data.current.item.status;
      }

      if (activeColumn === overColumn) {
        return prev; // Handled in dragEnd for sorting
      }

      const activeItems = [...prev[activeColumn]];
      const overItems = [...prev[overColumn]];
      const activeIndex = activeItems.findIndex((t) => t.id === activeId);
      
      let overIndex = 0;
      if (isOverTask) {
        overIndex = overItems.findIndex((t) => t.id === overId);
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        overIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      } else {
        overIndex = overItems.length + 1;
      }

      // Update status on the item data so next renders know its new column
      activeItems[activeIndex].status = overColumn as any;

      return {
        ...prev,
        [activeColumn]: activeItems.filter((t) => t.id !== activeId),
        [overColumn]: [
          ...overItems.slice(0, overIndex),
          activeItems[activeIndex],
          ...overItems.slice(overIndex, overItems.length),
        ],
      };
    });
  };

  const handleDragEnd = async (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeItemData = active.data.current?.item as RoadmapItem;
    if (!activeItemData) return;

    const currentColumn = activeItemData.status;

    // Handle sort in same column
    const isOverTask = over.data.current?.type === 'Item';
    let overColumn = overId;
    if (isOverTask) {
      overColumn = over.data.current.item.status;
    }

    if (currentColumn === overColumn) {
      const activeIndex = columns[currentColumn].findIndex((t) => t.id === activeId);
      let overIndex = columns[currentColumn].findIndex((t) => t.id === overId);
      
      if (activeIndex !== overIndex) {
        setColumns((prev) => {
          const newCol = arrayMove(prev[currentColumn], activeIndex, overIndex);
          // Optimistically save positions
          newCol.forEach((item, idx) => {
            if (item.position !== idx) {
               updateItem({ id: item.id, updates: { position: idx } });
            }
          });
          return { ...prev, [currentColumn]: newCol };
        });
      }
    } else {
      // It was moved across columns in dragOver, we just need to persist the status & positions of the new column
      try {
        const newColItems = columns[currentColumn];
        const newIndex = newColItems.findIndex((t) => t.id === activeId);
        
        await updateItem({
          id: activeId,
          updates: {
            status: currentColumn,
            position: newIndex,
          }
        });
        
        // Also update remaining items positions
        newColItems.forEach((item, idx) => {
          if (item.id !== activeId && item.position !== idx) {
             updateItem({ id: item.id, updates: { position: idx } });
          }
        });
      } catch (err) {
        toast.error('Failed to update task status');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent, status: string) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    try {
      await createItem({
        title: newItemTitle,
        status: status as any,
        builder_id: builderId,
        position: columns[status].length
      });
      setNewItemTitle('');
      setAddingToCol(null);
      toast.success('Task added');
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;
  }

  const columnConfig = [
    { 
      id: 'now', 
      title: 'Now', 
      accent: 'bg-emerald-500 shadow-emerald-500/40',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
      columnBg: 'bg-slate-800/20 border border-slate-800/50 hover:bg-slate-800/40'
    },
    { 
      id: 'next', 
      title: 'Next', 
      accent: 'bg-amber-500 shadow-amber-500/40',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400',
      columnBg: 'bg-slate-800/20 border border-slate-800/50 hover:bg-slate-800/40'
    },
    { 
      id: 'later', 
      title: 'Later', 
      accent: 'bg-slate-400 shadow-slate-400/40',
      text: 'text-slate-400',
      badge: 'bg-slate-800 text-slate-400',
      columnBg: 'bg-slate-800/20 border border-slate-800/50 hover:bg-slate-800/40'
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      accent: 'bg-primary-500 shadow-primary-500/40',
      text: 'text-primary-400',
      badge: 'bg-primary-500/20 text-primary-400',
      columnBg: 'bg-slate-800/20 border border-slate-800/50 hover:bg-slate-800/40'
    }
  ];

  const activeItem = activeId ? items?.find(i => i.id === activeId) : null;

  return (
    <div className="h-full w-full flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar items-start snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {columnConfig.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-[85vw] max-w-[340px] sm:w-[320px] flex flex-col max-h-full snap-center">
              
              <DroppableColumn id={col.id} bgClass={col.columnBg}>
                <div className="flex items-center justify-between mb-2 px-2 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${col.accent} shadow-lg`} />
                    <span className={`font-extrabold text-[13px] uppercase tracking-wider ${col.text}`}>{col.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badge}`}>{columns[col.id]?.length || 0}</span>
                </div>

                <SortableContext items={columns[col.id].map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {columns[col.id].map((item) => (
                    <div key={item.id} onClick={() => setSelectedItem(item)}>
                      <SortableItem id={item.id} item={item} onDelete={handleDeleteItem} />
                    </div>
                  ))}
                </SortableContext>
                
                {addingToCol === col.id ? (
                  <form onSubmit={(e) => handleCreate(e, col.id)} className="bg-[#151A27] p-4 rounded-2xl border border-slate-800 shadow-lg mt-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="What needs to be done?"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      className="w-full text-[13px] font-medium outline-none bg-transparent text-white placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-2 mt-4">
                      <button type="submit" className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-[12px] font-bold transition-colors">Add</button>
                      <button type="button" onClick={() => setAddingToCol(null)} className="px-4 py-1.5 text-slate-400 hover:bg-slate-800 rounded-lg text-[12px] font-bold transition-colors">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingToCol(col.id)}
                    className="flex items-center justify-center gap-2 p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-2xl transition-all text-[13px] font-bold mt-1 w-full border-2 border-dashed border-transparent hover:border-slate-700 hover:shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add task
                  </button>
                )}
              </DroppableColumn>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeId && activeItem ? (
            <div className="opacity-80 scale-105 shadow-xl pointer-events-none">
              <SortableItem id={activeItem.id} item={activeItem} onDelete={handleDeleteItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {selectedItem && (
          <RoadmapItemModal 
            item={items?.find(i => i.id === selectedItem.id) || selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
