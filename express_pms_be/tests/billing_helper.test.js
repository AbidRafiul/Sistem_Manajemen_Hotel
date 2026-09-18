/**
 * Unit Test for Billing Helper (Single Source of Truth)
 */

describe("Billing Helper Financial Calculation Logic", () => {
  const calculateBillingFormula = ({ rooms = [], charges = [], taxes = [], payments = [] }) => {
    let subtotalRooms = 0;
    for (const rm of rooms) {
      subtotalRooms += Number(rm.rate_per_night || 0);
    }

    let subtotalCharges = 0;
    for (const ch of charges) {
      subtotalCharges += Number(ch.total_amount || 0);
    }

    const subtotal = subtotalRooms + subtotalCharges;

    let totalTax = 0;
    const taxDetails = [];
    for (const tax of taxes) {
      const taxRate = Number(tax.tax_rate || 0);
      const taxAmt = Math.round((subtotal * taxRate) / 100);
      totalTax += taxAmt;
      taxDetails.push({
        tax_name: tax.tax_name,
        tax_rate: taxRate,
        tax_amount: taxAmt
      });
    }

    const totalCharges = subtotal + totalTax;

    let totalPaid = 0;
    for (const p of payments) {
      totalPaid += Number(p.amount || 0);
    }

    const rawBalance = totalCharges - totalPaid;
    const balance = Math.max(0, rawBalance);
    const isSettled = balance <= 0;

    let paymentStatus = "unpaid";
    if (totalPaid >= totalCharges) {
      paymentStatus = "paid";
    } else if (totalPaid > 0) {
      paymentStatus = "partially_paid";
    }

    return {
      subtotal,
      subtotal_rooms: subtotalRooms,
      subtotal_charges: subtotalCharges,
      total_tax: totalTax,
      total_charges: totalCharges,
      total_paid: totalPaid,
      balance,
      is_settled: isSettled,
      payment_status: paymentStatus,
      tax_details: taxDetails
    };
  };

  it("should calculate single room with taxes correctly and mark as unpaid when 0 payment", () => {
    const result = calculateBillingFormula({
      rooms: [{ rate_per_night: 500000 }],
      charges: [],
      taxes: [
        { tax_name: "Pajak Hotel PB1", tax_rate: 10 },
        { tax_name: "Service Charge", tax_rate: 5 }
      ],
      payments: []
    });

    expect(result.subtotal).toBe(500000);
    expect(result.total_tax).toBe(75000); // 50,000 + 25,000
    expect(result.total_charges).toBe(575000);
    expect(result.total_paid).toBe(0);
    expect(result.balance).toBe(575000);
    expect(result.is_settled).toBe(false);
    expect(result.payment_status).toBe("unpaid");
  });

  it("should mark as settled and paid when full payment including upfront taxes is received", () => {
    const result = calculateBillingFormula({
      rooms: [{ rate_per_night: 1000000 }],
      charges: [{ total_amount: 150000, nama_charge: "Extra Bed" }],
      taxes: [{ tax_name: "PB1", tax_rate: 10 }],
      payments: [{ amount: 1265000, payment_method: "cash" }]
    });

    // Subtotal = 1,000,000 + 150,000 = 1,150,000
    // Tax 10% = 115,000
    // Total Charges = 1,265,000
    expect(result.subtotal).toBe(1150000);
    expect(result.total_tax).toBe(115000);
    expect(result.total_charges).toBe(1265000);
    expect(result.total_paid).toBe(1265000);
    expect(result.balance).toBe(0);
    expect(result.is_settled).toBe(true);
    expect(result.payment_status).toBe("paid");
  });

  it("should handle partial deposit correctly and calculate exact remaining balance", () => {
    const result = calculateBillingFormula({
      rooms: [{ rate_per_night: 800000 }],
      charges: [],
      taxes: [{ tax_name: "PB1", tax_rate: 10 }],
      payments: [{ amount: 400000, payment_method: "transfer" }]
    });

    // Total charges = 880,000. Paid = 400,000. Balance = 480,000
    expect(result.total_charges).toBe(880000);
    expect(result.total_paid).toBe(400000);
    expect(result.balance).toBe(480000);
    expect(result.is_settled).toBe(false);
    expect(result.payment_status).toBe("partially_paid");
  });

  it("should aggregate multi-room reservations accurately", () => {
    const result = calculateBillingFormula({
      rooms: [
        { nomor_kamar: "101", rate_per_night: 500000 },
        { nomor_kamar: "102", rate_per_night: 750000 }
      ],
      charges: [],
      taxes: [{ tax_name: "PB1", tax_rate: 10 }],
      payments: [{ amount: 1375000 }]
    });

    // Subtotal = 1,250,000. Tax = 125,000. Total = 1,375,000.
    expect(result.subtotal).toBe(1250000);
    expect(result.total_tax).toBe(125000);
    expect(result.total_charges).toBe(1375000);
    expect(result.balance).toBe(0);
    expect(result.is_settled).toBe(true);
  });
});
