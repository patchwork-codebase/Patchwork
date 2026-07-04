import React, { useState, useEffect } from 'react';
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
import { Loader2, Plus, GripVertical, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 relative group hover:border-slate-300 transition-colors cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between">
        <h4 className="font-bold text-slate-900 text-[14px] leading-tight pr-6">{item.title}</h4>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-4 cursor-grab text-slate-400">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      {item.description && (
        <p className="text-[12px] text-slate-500 line-clamp-2">{item.description}</p>
      )}
      <div className="flex items-center justify-between mt-1 text-[11px] font-medium text-slate-400">
        {item.sprint_id ? (
          <span className="flex items-center gap-1 text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full">
            <Calendar className="w-3 h-3" /> Sprint
          </span>
        ) : (
          <span>Unplanned</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(item.id);
          }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-50 text-rose-500 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// --- Droppable Column Component ---
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex-1 flex flex-col gap-3 min-h-[150px] p-2 -mx-2 rounded-xl">
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

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem({ id: itemId });
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  useEffect(() => {
    if (items) {
      setColumns({
        now: items.filter(i => i.status === 'now').sort((a, b) => a.position - b.position),
        next: items.filter(i => i.status === 'next').sort((a, b) => a.position - b.position),
        later: items.filter(i => i.status === 'later').sort((a, b) => a.position - b.position),
        completed: items.filter(i => i.status === 'completed').sort((a, b) => a.position - b.position)
      });
    }
  }, [items]);

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
    { id: 'now', title: 'Now', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'next', title: 'Next', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'later', title: 'Later', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    { id: 'completed', title: 'Completed', color: 'bg-purple-50 text-purple-700 border-purple-200' }
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
        <div className="flex gap-4 h-full overflow-x-auto pb-4 custom-scrollbar items-start">
          {columnConfig.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-[300px] flex flex-col max-h-full">
              <div className={`px-3 py-2 rounded-lg font-bold text-[13px] mb-3 border ${col.color} flex items-center justify-between`}>
                <span className="uppercase tracking-wider">{col.title}</span>
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-[11px]">{columns[col.id]?.length || 0}</span>
              </div>

              <DroppableColumn id={col.id}>
                <SortableContext items={columns[col.id].map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {columns[col.id].map((item) => (
                    <SortableItem key={item.id} id={item.id} item={item} onDelete={handleDeleteItem} />
                  ))}
                </SortableContext>
                
                {addingToCol === col.id ? (
                  <form onSubmit={(e) => handleCreate(e, col.id)} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mt-1">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Task title..."
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      className="w-full text-[13px] font-medium outline-none placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <button type="submit" className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-[11px] font-bold">Add</button>
                      <button type="button" onClick={() => setAddingToCol(null)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg text-[11px] font-bold">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingToCol(col.id)}
                    className="flex items-center gap-2 p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 rounded-xl transition-colors text-[13px] font-medium mt-1 w-full border border-dashed border-transparent hover:border-slate-300"
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
    </div>
  );
}
