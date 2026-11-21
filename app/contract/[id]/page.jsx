import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import SignaturePad from '@/components/SignaturePad';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function ContractPage({ params }) {
  const { id } = params;
  const auth = await getCurrentUserRole();

  if (!auth) {
    redirect('/login');
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch agent and entity
  const { data: agent, error } = await admin
    .from('agents')
    .select('*, entities(id, code, name, commission_rate)')
    .eq('id', id)
    .single();

  if (error || !agent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 440, textAlign: 'center', padding: 30, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <h2>Contract Not Found</h2>
          <p style={{ color: '#64748B' }}>The requested sales agent agreement could not be located.</p>
          <Link href={auth.role === 'agent' ? '/portal' : '/agents'} className="btn" style={{ marginTop: 12, display: 'inline-block' }}>
            Return Back
          </Link>
        </div>
      </div>
    );
  }

  // Security: only the agent themselves or a director can view
  const isSelf = auth.user.email.toLowerCase() === agent.email?.toLowerCase();
  const isDirector = auth.role === 'director';

  if (!isSelf && !isDirector) {
    redirect('/');
  }

  const commissionPct = (Number(agent.commission_rate || 0.10) * 100).toFixed(1);
  const isSigned = !!agent.agreement_signed_at;
  const signedDateStr = agent.agreement_signed_at
    ? new Date(agent.agreement_signed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const signedTimeStr = agent.agreement_signed_at
    ? new Date(agent.agreement_signed_at).toLocaleTimeString('en-GB')
    : null;

  const backUrl = auth.role === 'agent' ? '/portal' : '/agents';

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', padding: '24px 16px' }}>
      
      {/* Top Action Bar (Hidden during Print) */}
      <div className="no-print" style={{
        maxWidth: 860,
        margin: '0 auto 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: '#fff',
        padding: '12px 20px',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={backUrl} style={{
            fontSize: 13,
            color: '#475569',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 500
          }}>
            ← Back to {auth.role === 'agent' ? 'Portal' : 'Agents Roster'}
          </Link>
          <span style={{ color: '#CBD5E1' }}>|</span>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 20,
            background: isSigned ? '#DCFCE7' : '#FEF3C7',
            color: isSigned ? '#15803D' : '#B45309'
          }}>
            {isSigned ? '✓ Officially Executed' : '⏳ Awaiting Signature'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PrintButton />
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="contract-paper" style={{
        maxWidth: 860,
        margin: '0 auto',
        background: '#ffffff',
        padding: '50px 60px',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        color: '#1E293B',
        fontFamily: '"Times New Roman", Times, Georgia, serif',
        lineHeight: 1.6
      }}>

        {/* Document Header */}
        <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: 20, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Image src="/logo.jpg" alt="Silent Strides" width={48} height={48} style={{ borderRadius: 6 }} />
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '0.5px', color: '#0F172A', textTransform: 'uppercase' }}>
                  Silent Strides Network Ltd
                </h1>
                <div style={{ fontSize: 13, color: '#64748B', fontFamily: 'sans-serif' }}>
                  Commercial Sales Agency Agreement · Republic of Kenya
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontFamily: 'sans-serif', fontSize: 12, color: '#64748B' }}>
            <div><b>REF:</b> SSN-AGR-{agent.id.slice(0, 8).toUpperCase()}</div>
            <div><b>Subsidiary:</b> {agent.entities?.code}</div>
            <div><b>Date:</b> {signedDateStr || new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 18, textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'underline' }}>
            Commercial Sales Agency & Commission Agreement
          </h2>
          <div style={{ fontSize: 13, fontStyle: 'italic', color: '#475569' }}>
            This Agreement is entered into and made effective as of the execution date herein by and between:
          </div>
        </div>

        {/* Parties Box */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 28,
          fontSize: 14,
          fontFamily: 'sans-serif'
        }}>
          <div style={{ marginBottom: 12 }}>
            <b>1. THE COMPANY:</b> <b>SILENT STRIDES NETWORK LTD</b> (operating through its subsidiary <b>{agent.entities?.name} [{agent.entities?.code}]</b>), with registered operations in Nairobi, Kenya (hereinafter referred to as the <i>"Company"</i>).
          </div>
          <div>
            <b>2. THE SALES AGENT:</b> <b>{agent.full_name}</b>, Email: <u>{agent.email || 'N/A'}</u>, Phone: <u>{agent.phone || 'N/A'}</u>{agent.id_number ? `, National ID/Passport: ${agent.id_number}` : ''} (hereinafter referred to as the <i>"Agent"</i>).
          </div>
        </div>

        {/* Agreement Body Clauses */}
        <div style={{ fontSize: 14, textAlign: 'justify' }}>
          
          <h4 style={{ margin: '18px 0 6px', fontSize: 14, textTransform: 'uppercase', color: '#0F172A' }}>
            1. APPOINTMENT & SCOPE OF AGENCY
          </h4>
          <p style={{ margin: '0 0 12px' }}>
            The Company hereby appoints the Agent, and the Agent accepts such appointment, as an authorized non-exclusive Sales Agent to market, solicit, promote, and secure customer sales for the products and services offered by the Company and its subsidiary (<b>{agent.entities?.name}</b>). The Agent shall have no authority to bind the Company in any contract or expenditure without prior written consent.
          </p>

          <h4 style={{ margin: '18px 0 6px', fontSize: 14, textTransform: 'uppercase', color: '#0F172A' }}>
            2. COMMISSION STRUCTURE & PAYMENT TERMS
          </h4>
          <p style={{ margin: '0 0 8px' }}>
            In consideration for the services rendered, the Company agrees to pay the Agent a commission on all verified customer sales closed by the Agent:
          </p>
          <ul style={{ margin: '0 0 12px', paddingLeft: 24 }}>
            <li><b>Agreed Commission Rate:</b> <b>{commissionPct}%</b> of the gross sales amount.</li>
            <li><b>Accrual:</b> Commission accrues immediately upon the recording and verification of the customer transaction in the Company portfolio system.</li>
            <li><b>Disbursement Currency:</b> All commission computations and disbursements shall be calculated and remitted in <b>Kenyan Shillings (KSh)</b>.</li>
            <li><b>Payout Schedule:</b> Payouts are made directly to the Agent upon request or on designated settlement dates, subject to verified ledger balance.</li>
          </ul>

          <h4 style={{ margin: '18px 0 6px', fontSize: 14, textTransform: 'uppercase', color: '#0F172A' }}>
            3. DUTIES AND PERFORMANCE OBLIGATIONS
          </h4>
          <p style={{ margin: '0 0 12px' }}>
            The Agent agrees to: (a) conduct all sales activities with the highest standards of integrity and commercial ethics; (b) accurately represent product specifications, warranties, and pricing as approved by the Company; (c) immediately remit any customer payments or funds collected to the Company account; and (d) accurately log every sale transaction into the Silent Strides Agent Portal.
          </p>

          <h4 style={{ margin: '18px 0 6px', fontSize: 14, textTransform: 'uppercase', color: '#0F172A' }}>
            4. CONFIDENTIALITY & NON-DISCLOSURE
          </h4>
          <p style={{ margin: '0 0 12px' }}>
            The Agent acknowledges that during the term of this Agreement, they will have access to confidential business information, pricing models, inventory costs, customer lists, and trade secrets of Silent Strides Network Ltd. The Agent agrees not to disclose, duplicate, or use any Confidential Information for personal gain or for any third party at any time during or after the termination of this Agreement.
          </p>

          <h4 style={{ margin: '18px 0 6px', fontSize: 14, textTransform: 'uppercase', color: '#0F172A' }}>
            5. INDEPENDENT CONTRACTOR RELATIONSHIP
          </h4>
          <p style={{ margin: '0 0 12px' }}>
            Nothing contained in this Agreement shall be construed to create an employer-employee relationship, partnership, or joint venture between the Company and the Agent. The Agent operates as an independent commercial sales representative and is solely responsible for their personal statutory taxes, statutory deductions, and operational expenses.
          </p>

          <h4 style={{ margin: '18px 0 6px', fontSize: 14, textTransform: 'uppercase', color: '#0F172A' }}>
            6. TERM AND TERMINATION
          </h4>
          <p style={{ margin: '0 0 12px' }}>
            This Agreement shall remain in force for an initial period of twelve (12) months from the date of execution and shall automatically renew unless terminated. Either party may terminate this Agreement by providing thirty (30) days written notice. In the event of fraudulent conduct, misappropriation of funds, or material breach, the Company reserves the right to terminate this Agreement immediately with forfeiture of accrued unpaid commissions.
          </p>

          <h4 style={{ margin: '18px 0 6px', fontSize: 14, textTransform: 'uppercase', color: '#0F172A' }}>
            7. GOVERNING LAW & DISPUTE RESOLUTION
          </h4>
          <p style={{ margin: '0 0 12px' }}>
            This Agreement shall be governed by, interpreted, and enforced in accordance with the substantive <b>Laws of the Republic of Kenya</b>. Any dispute arising out of or in connection with this Agreement shall be settled amicably, failing which it shall be referred to arbitration under the Nairobi Centre for International Arbitration (NCIA).
          </p>

        </div>

        {/* Execution & Signature Section */}
        <div style={{ marginTop: 36, paddingTop: 24, borderTop: '2px solid #0F172A', pageBreakInside: 'avoid' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Execution & Electronic Signatures
            </h3>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'sans-serif' }}>
              IN WITNESS WHEREOF, the parties hereto have electronically executed this Agreement as a binding legal contract.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, fontFamily: 'sans-serif' }}>
            
            {/* Company Block */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '16px',
              fontSize: 13
            }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4, textTransform: 'uppercase', fontSize: 12 }}>
                For & On Behalf of Company:
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>SILENT STRIDES NETWORK LTD</div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>Subsidiary: {agent.entities?.name}</div>

              {/* Company Signature Display */}
              <div style={{
                height: 70,
                borderBottom: '1px solid #0F172A',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {agent.director_signature_data ? (
                  <img src={agent.director_signature_data} alt="Director Signature" style={{ maxHeight: 60, maxWidth: '90%' }} />
                ) : isSigned ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 18, color: '#0F172A', fontWeight: 600 }}>
                      Silent Strides Executive
                    </div>
                    <div style={{ fontSize: 10, color: '#15803D' }}>✓ Authorized Corporate Seal</div>
                  </div>
                ) : (
                  <span style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic' }}>Pending Execution</span>
                )}
              </div>

              <div style={{ fontSize: 12 }}>
                <div><b>Authorized Signatory:</b> Director / Managing Partner</div>
                <div><b>Corporate Status:</b> Verified Network Ltd</div>
                <div><b>Date:</b> {signedDateStr || 'Pending'}</div>
              </div>
            </div>

            {/* Sales Agent Block */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '16px',
              fontSize: 13
            }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4, textTransform: 'uppercase', fontSize: 12 }}>
                The Sales Agent:
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{agent.full_name}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                ID/Passport: {agent.id_number || 'Registered Agent'}
              </div>

              {/* Agent Signature Display */}
              <div style={{
                height: 70,
                borderBottom: '1px solid #0F172A',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {agent.signature_data ? (
                  <img src={agent.signature_data} alt="Agent Signature" style={{ maxHeight: 60, maxWidth: '90%' }} />
                ) : isSigned ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: '#0F172A' }}>
                      {agent.signed_name || agent.full_name}
                    </div>
                    <div style={{ fontSize: 10, color: '#15803D' }}>✓ Electronically Signed</div>
                  </div>
                ) : (
                  <span style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic' }}>Signature Required Below</span>
                )}
              </div>

              <div style={{ fontSize: 12 }}>
                <div><b>Signatory Name:</b> {agent.signed_name || agent.full_name}</div>
                <div><b>Digital Timestamp:</b> {signedDateStr ? `${signedDateStr} at ${signedTimeStr}` : 'Pending'}</div>
                <div><b>Audit Ref:</b> SSN-VLD-{agent.id.slice(0, 6)}</div>
              </div>
            </div>

          </div>
        </div>

        {/* Interactive Signature Pad (if not signed yet) */}
        {!isSigned && (
          <div className="no-print">
            <SignaturePad
              agentId={agent.id}
              agentName={agent.full_name}
              isDirector={isDirector && !isSelf}
            />
          </div>
        )}

      </div>

      {/* Print CSS Rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .contract-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 20px 30px !important;
            max-width: 100% !important;
          }
        }
      `}} />

    </div>
  );
}
