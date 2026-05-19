export const COMPANY_NAME = "PULSE 7 EVENTS"
export const COMPANY_EMAIL = "info@cybercina.co.uk"

export function generateTerms(data: {
  companyName: string
  customerName: string
  reference: string
  hireStartDate: string
  hireEndDate: string
}): string {
  return `EQUIPMENT HIRE AGREEMENT

Reference: ${data.reference}
Between: ${data.companyName} ("the Company") and ${data.customerName} ("the Customer")
Hire Period: ${data.hireStartDate} to ${data.hireEndDate}

1. DEFINITIONS
"Equipment" means all items listed in this agreement. "Hire Period" means the period from the delivery/collection date to the return date stated above.

2. HIRE CHARGES & PAYMENT
2.1 The hire charges are as stated in the quote. A deposit of 30% is due upon booking confirmation.
2.2 The remaining balance is due 7 days prior to the hire start date unless otherwise agreed in writing.
2.3 Late payment may result in cancellation of the hire and forfeiture of the deposit.
2.4 All prices are subject to VAT at the prevailing rate where applicable.

3. DELIVERY & COLLECTION
3.1 The Company will deliver and collect the Equipment at the venue address stated in the booking.
3.2 The Customer must ensure safe and adequate access to the venue for delivery, setup, and collection.
3.3 If access is not available, a re-delivery charge may apply.

4. CUSTOMER RESPONSIBILITIES
4.1 The Customer is responsible for the Equipment from the time of delivery until collection by the Company.
4.2 The Customer must not allow the Equipment to be used by any unauthorised person.
4.3 The Customer must not attempt to repair, alter, or modify the Equipment.
4.4 The Equipment must be kept secure and protected from theft, damage, or adverse weather conditions.
4.5 The Customer must not sub-hire or lend the Equipment to any third party.

5. DAMAGE, LOSS & REPLACEMENT
5.1 The Customer is liable for any loss, theft, or damage to the Equipment during the hire period.
5.2 In the event of damage, the Customer will be charged the cost of repair or replacement, whichever is lower, as stated in the Equipment Replacement Values schedule attached to this agreement.
5.3 Normal wear and tear is accepted and will not be charged.
5.4 The Customer is strongly advised to ensure the Equipment is covered under their own event insurance.

6. CANCELLATION POLICY
6.1 Cancellation more than 14 days before hire: deposit forfeited.
6.2 Cancellation 7–14 days before hire: 50% of total hire charge due.
6.3 Cancellation less than 7 days before hire: 100% of total hire charge due.
6.4 Cancellations must be made in writing to ${data.companyName}.

7. COMPANY LIABILITY
7.1 The Company's liability is limited to the total hire charge paid.
7.2 The Company is not liable for any indirect, consequential, or economic loss arising from Equipment failure.
7.3 The Company will endeavour to replace faulty Equipment as soon as reasonably practicable.

8. FORCE MAJEURE
8.1 Neither party shall be liable for failure to fulfil obligations due to circumstances beyond their reasonable control, including but not limited to natural disasters, government restrictions, or acts of God.

9. ELECTRICAL SAFETY
9.1 All electrical equipment supplied is PAT tested and in good working order.
9.2 The Customer must not connect the Equipment to inadequate power supplies.
9.3 Outdoor use requires appropriate weather protection as agreed with the Company.

10. GENERAL
10.1 This agreement is governed by the laws of England and Wales.
10.2 Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
10.3 This agreement constitutes the entire agreement between the parties.
10.4 The Customer confirms they are aged 18 or over and have the authority to enter into this agreement.

By signing below, the Customer confirms they have read, understood, and agreed to all terms and conditions above.`
}
