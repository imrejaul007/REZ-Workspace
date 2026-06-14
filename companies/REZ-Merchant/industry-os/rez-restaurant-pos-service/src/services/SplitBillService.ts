import { Bill, SplitType, ISplitShare, IBillItem } from '../models/Bill';

interface SplitByItemInput {
  billId: string;
  assignments: Array<{
    itemId: string;
    personId: string;
    personName: string;
  }>;
}

interface SplitByPersonInput {
  billId: string;
  persons: Array<{
    personId: string;
    personName: string;
    customAmount?: number;
  }>;
}

interface EqualSplitInput {
  billId: string;
  numberOfPeople: number;
  includeTips?: boolean;
}

export class SplitBillService {
  async splitByItem(input: SplitByItemInput): Promise<{
    billId: string;
    splitType: SplitType;
    splitShares: ISplitShare[];
    totalAmount: number;
  }> {
    const bill = await Bill.findOne({ billId: input.billId });
    if (!bill) {
      throw new Error(`Bill ${input.billId} not found`);
    }

    if (bill.status !== 'OPEN') {
      throw new Error('Cannot split a closed or cancelled bill');
    }

    const personMap = new Map<string, {
      personName: string;
      items: string[];
      subtotal: number;
      taxAmount: number;
      discount: number;
      total: number;
    }>();

    for (const assignment of input.assignments) {
      const item = bill.items.find((i) => i.itemId === assignment.itemId);
      if (!item) {
        throw new Error(`Item ${assignment.itemId} not found in bill`);
      }

      if (!personMap.has(assignment.personId)) {
        personMap.set(assignment.personId, {
          personName: assignment.personName,
          items: [],
          subtotal: 0,
          taxAmount: 0,
          discount: 0,
          total: 0,
        });
      }

      const person = personMap.get(assignment.personId)!;
      person.items.push(assignment.itemId);

      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const taxableAmount = itemSubtotal - itemDiscount;
      const proportionalTax = (taxableAmount / bill.subtotal) * bill.totalTaxAmount;
      const proportionalDiscount = (itemSubtotal / bill.subtotal) * bill.totalDiscount;
      const itemTotal = taxableAmount + proportionalTax - proportionalDiscount;

      person.subtotal += itemSubtotal;
      person.taxAmount += proportionalTax;
      person.discount += itemDiscount + proportionalDiscount;
      person.total += itemTotal;
    }

    const splitShares: ISplitShare[] = Array.from(personMap.entries()).map(([personId, data]) => ({
      personId,
      personName: data.personName,
      items: data.items,
      subtotal: Math.round(data.subtotal * 100) / 100,
      taxAmount: Math.round(data.taxAmount * 100) / 100,
      discount: Math.round(data.discount * 100) / 100,
      total: Math.round(data.total * 100) / 100,
    }));

    bill.splitType = SplitType.BY_ITEM;
    bill.splitShares = splitShares;
    await bill.save();

    const totalAmount = splitShares.reduce((sum, share) => sum + share.total, 0);

    return {
      billId: bill.billId,
      splitType: SplitType.BY_ITEM,
      splitShares,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  async splitByPerson(input: SplitByPersonInput): Promise<{
    billId: string;
    splitType: SplitType;
    splitShares: ISplitShare[];
    totalAmount: number;
  }> {
    const bill = await Bill.findOne({ billId: input.billId });
    if (!bill) {
      throw new Error(`Bill ${input.billId} not found`);
    }

    if (bill.status !== 'OPEN') {
      throw new Error('Cannot split a closed or cancelled bill');
    }

    const totalBillAmount = bill.grandTotal;
    const perPersonAmount = totalBillAmount / input.persons.length;

    const splitShares: ISplitShare[] = input.persons.map((person, index) => {
      let shareTotal: number;

      if (person.customAmount !== undefined) {
        shareTotal = person.customAmount;
      } else {
        const proportionalSubtotal = bill.subtotal / input.persons.length;
        const proportionalTax = bill.totalTaxAmount / input.persons.length;
        const proportionalDiscount = bill.totalDiscount / input.persons.length;
        shareTotal = proportionalSubtotal + proportionalTax - proportionalDiscount;
      }

      const proportionalSubtotal = (bill.subtotal / input.persons.length);
      const proportionalTax = (bill.totalTaxAmount / input.persons.length);
      const proportionalDiscount = (bill.totalDiscount / input.persons.length);

      return {
        personId: person.personId,
        personName: person.personName,
        items: [],
        subtotal: Math.round(proportionalSubtotal * 100) / 100,
        taxAmount: Math.round(proportionalTax * 100) / 100,
        discount: Math.round(proportionalDiscount * 100) / 100,
        total: Math.round(shareTotal * 100) / 100,
      };
    });

    bill.splitType = SplitType.BY_PERSON;
    bill.splitShares = splitShares;
    await bill.save();

    return {
      billId: bill.billId,
      splitType: SplitType.BY_PERSON,
      splitShares,
      totalAmount: totalBillAmount,
    };
  }

  async equalSplit(input: EqualSplitInput): Promise<{
    billId: string;
    splitType: SplitType;
    splitShares: ISplitShare[];
    perPersonAmount: number;
    totalAmount: number;
  }> {
    const bill = await Bill.findOne({ billId: input.billId });
    if (!bill) {
      throw new Error(`Bill ${input.billId} not found`);
    }

    if (bill.status !== 'OPEN') {
      throw new Error('Cannot split a closed or cancelled bill');
    }

    if (input.numberOfPeople < 1) {
      throw new Error('Number of people must be at least 1');
    }

    let amountToSplit = bill.grandTotal;
    if (input.includeTips) {
      amountToSplit = bill.subtotal - bill.totalDiscount + bill.totalTaxAmount;
    }

    const perPersonSubtotal = bill.subtotal / input.numberOfPeople;
    const perPersonTax = bill.totalTaxAmount / input.numberOfPeople;
    const perPersonDiscount = bill.totalDiscount / input.numberOfPeople;
    const perPersonAmount = (amountToSplit + bill.tipAmount) / input.numberOfPeople;

    const splitShares: ISplitShare[] = Array.from({ length: input.numberOfPeople }).map((_, index) => ({
      personId: `PERSON-${index + 1}`,
      personName: `Person ${index + 1}`,
      items: [],
      subtotal: Math.round(perPersonSubtotal * 100) / 100,
      taxAmount: Math.round(perPersonTax * 100) / 100,
      discount: Math.round(perPersonDiscount * 100) / 100,
      total: Math.round(perPersonAmount * 100) / 100,
    }));

    bill.splitType = SplitType.EQUAL;
    bill.splitShares = splitShares;
    await bill.save();

    return {
      billId: bill.billId,
      splitType: SplitType.EQUAL,
      splitShares,
      perPersonAmount: Math.round(perPersonAmount * 100) / 100,
      totalAmount: bill.grandTotal,
    };
  }

  async removeSplit(billId: string): Promise<{ billId: string; splitType: null; splitShares: [] }> {
    const bill = await Bill.findOne({ billId: bill.billId });
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    if (bill.status !== 'OPEN') {
      throw new Error('Cannot modify a closed or cancelled bill');
    }

    bill.splitType = undefined;
    bill.splitShares = undefined;
    await bill.save();

    return {
      billId: bill.billId,
      splitType: null,
      splitShares: [],
    };
  }

  async getSplitDetails(billId: string): Promise<{
    billId: string;
    splitType: SplitType | null;
    splitShares: ISplitShare[];
    totalAmount: number;
  } | null> {
    const bill = await Bill.findOne({ billId });
    if (!bill) {
      return null;
    }

    return {
      billId: bill.billId,
      splitType: bill.splitType || null,
      splitShares: bill.splitShares || [],
      totalAmount: bill.grandTotal,
    };
  }

  async calculateShare(
    billId: string,
    personId: string
  ): Promise<{
    personId: string;
    personName: string;
    subtotal: number;
    taxAmount: number;
    discount: number;
    total: number;
    items: IBillItem[];
  } | null> {
    const bill = await Bill.findOne({ billId });
    if (!bill || !bill.splitShares) {
      return null;
    }

    const share = bill.splitShares.find((s) => s.personId === personId);
    if (!share) {
      return null;
    }

    const shareItems = share.items.length > 0
      ? bill.items.filter((item) => share.items.includes(item.itemId))
      : bill.items;

    return {
      personId: share.personId,
      personName: share.personName,
      subtotal: share.subtotal,
      taxAmount: share.taxAmount,
      discount: share.discount,
      total: share.total,
      items: shareItems,
    };
  }
}

export const splitBillService = new SplitBillService();
