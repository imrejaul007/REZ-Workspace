'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatINR } from '@/lib/utils/currency';
import { CartItem } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface Person {
  id: string;
  name: string;
  color: string;
}

interface SplitBillByItemProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSplitComplete: (splits: Map<string, string[]>, perPersonAmounts: Map<string, number>) => void;
}

const PERSON_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

export default function SplitBillByItem({
  isOpen,
  onClose,
  items,
  onSplitComplete,
}: SplitBillByItemProps) {
  const [people, setPeople] = useState<Person[]>([
    { id: '1', name: 'You', color: PERSON_COLORS[0] },
  ]);
  const [nextId, setNextId] = useState(2);
  const [assignments, setAssignments] = useState<Map<string, string[]>>(new Map());
  const [showShareLink, setShowShareLink] = useState(false);

  // Initialize assignments with first person
  useMemo(() => {
    if (items.length > 0 && assignments.size === 0) {
      const initial = new Map<string, string[]>();
      items.forEach((item) => {
        initial.set(item.itemId, ['1']);
      });
      setAssignments(initial);
    }
  }, [items, assignments.size]);

  const addPerson = () => {
    if (people.length >= 8) return;
    const color = PERSON_COLORS[people.length % PERSON_COLORS.length];
    setPeople([...people, { id: String(nextId), name: `Person ${nextId}`, color }]);
    setNextId(nextId + 1);
  };

  const removePerson = (id: string) => {
    if (people.length <= 1) return;
    setPeople(people.filter((p) => p.id !== id));
    // Reassign their items to person 1
    const newAssignments = new Map(assignments);
    assignments.forEach((personIds, itemId) => {
      if (personIds.includes(id)) {
        const filtered = personIds.filter((p) => p !== id);
        if (filtered.length === 0) {
          newAssignments.set(itemId, ['1']);
        } else {
          newAssignments.set(itemId, filtered);
        }
      }
    });
    setAssignments(newAssignments);
  };

  const toggleItemAssignment = (itemId: string, personId: string) => {
    const current = assignments.get(itemId) || [];
    let newAssignment: string[];

    if (current.includes(personId)) {
      // Remove person from item (but ensure at least one person is assigned)
      if (current.length === 1) return;
      newAssignment = current.filter((p) => p !== personId);
    } else {
      // Add person to item (evenly split cost)
      newAssignment = [...current, personId];
    }

    const newAssignments = new Map(assignments);
    newAssignments.set(itemId, newAssignment);
    setAssignments(newAssignments);
  };

  const calculatePerPersonAmount = (personId: string): number => {
    let total = 0;
    items.forEach((item) => {
      const assigned = assignments.get(item.itemId) || [];
      if (assigned.includes(personId)) {
        total += (item.price * item.quantity) / assigned.length;
      }
    });
    return Math.ceil(total);
  };

  const handleConfirm = () => {
    const perPersonAmounts = new Map<string, number>();
    people.forEach((p) => {
      perPersonAmounts.set(p.id, calculatePerPersonAmount(p.id));
    });
    onSplitComplete(assignments, perPersonAmounts);
    onClose();
  };

  const generateShareLink = () => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const splitData = {
      p: people.map((p) => p.name),
      i: items.map((item) => ({
        id: item.itemId,
        n: item.name,
        p: item.price,
        q: item.quantity,
        a: assignments.get(item.itemId) || [],
      })),
    };
    const encoded = btoa(JSON.stringify(splitData));
    return `${base}/split?data=${encoded}`;
  };

  const copyShareLink = async () => {
    const link = generateShareLink();
    try {
      await navigator.clipboard.writeText(link);
      setShowShareLink(false);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const perPersonTotals = useMemo(() => {
    const totals = new Map<string, number>();
    people.forEach((p) => {
      totals.set(p.id, calculatePerPersonAmount(p.id));
    });
    return totals;
  }, [people, assignments, items]);

  const totalAssigned = Array.from(perPersonTotals.values()).reduce((a, b) => a + b, 0);
  const unassignedItems = items.filter((item) => {
    const assigned = assignments.get(item.itemId) || [];
    return assigned.length === 0;
  });

  return (
    <Modal open={isOpen} onClose={onClose} title="Split by Item" size="lg">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto">
        {/* People list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Split between</span>
            <button
              onClick={addPerson}
              disabled={people.length >= 8}
              className="text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              + Add person
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{ borderColor: person.color }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: person.color }}
                />
                <span className="text-sm font-medium text-gray-700">{person.name}</span>
                {people.length > 1 && person.id !== '1' && (
                  <button
                    onClick={() => removePerson(person.id)}
                    className="text-gray-400 hover:text-red-500 ml-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Item assignments */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-gray-700">Assign items</span>
          {items.map((item) => {
            const assigned = assignments.get(item.itemId) || [];
            return (
              <div
                key={item.itemId}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.name}
                      {item.quantity > 1 && <span className="text-gray-500"> x{item.quantity}</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatINR(item.price * item.quantity)} total · {formatINR(item.price)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatINR((item.price * item.quantity) / assigned.length)}
                    </p>
                    {assigned.length > 1 && (
                      <p className="text-xs text-gray-500">
                        {formatINR(item.price)} x {item.quantity}/{assigned.length}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {people.map((person) => {
                    const isAssigned = assigned.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        onClick={() => toggleItemAssignment(item.itemId, person.id)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                          isAssigned
                            ? 'text-white'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400',
                        )}
                        style={isAssigned ? { backgroundColor: person.color, borderColor: person.color } : undefined}
                      >
                        {person.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Per person summary */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
          <span className="text-sm font-medium text-gray-700">Per person total</span>
          {people.map((person) => {
            const amount = perPersonTotals.get(person.id) || 0;
            return (
              <div key={person.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: person.color }}
                  />
                  <span className="text-sm text-gray-700">{person.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatINR(amount)}</span>
              </div>
            );
          })}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-sm font-bold text-indigo-700">{formatINR(totalAssigned)}</span>
          </div>
        </div>

        {/* Warnings */}
        {unassignedItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            {unassignedItems.length} item(s) are not assigned to anyone
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleConfirm}
            disabled={unassignedItems.length > 0}
          >
            Confirm split
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => setShowShareLink(!showShareLink)}
            >
              {showShareLink ? 'Hide' : 'Share'} split link
            </Button>
            <Button variant="ghost" size="md" fullWidth onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Share link section */}
        {showShareLink && (
          <div className="bg-indigo-50 rounded-xl px-4 py-3 space-y-2">
            <p className="text-xs text-indigo-700">
              Share this link so others can add themselves and see what they owe
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={generateShareLink()}
                readOnly
                className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-200 rounded-lg text-gray-700"
              />
              <Button variant="secondary" size="sm" onClick={copyShareLink}>
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
