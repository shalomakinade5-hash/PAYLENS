import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { useApiData } from '../api/useApiData.js'
import { ErrorState, LoadingState } from '../components/DataStates.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { formatCurrency } from '../utils/format.js'

const sampleQuestions = [
  'Why did this payment fail?',
  'Is this payment worth recovering?',
  'What happened with this transaction?',
  'Are there similar failed payments?',
]

export default function AIInvestigatorPage() {
  const { data: transactions, error: transactionsError, loading: transactionsLoading, retry } = useApiData('/api/transactions')
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedId = searchParams.get('transactionId')
  const transactionId = (transactions || []).some((item) => item.transaction_id === requestedId)
    ? requestedId
    : transactions?.[0]?.transaction_id || ''
  const [question, setQuestion] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [requestError, setRequestError] = useState(null)
  const [investigating, setInvestigating] = useState(false)

  async function submitInvestigation(event) {
    event?.preventDefault()
    setInvestigating(true)
    setRequestError(null)
    setAnalysis(null)
    try {
      const result = await apiRequest('/api/ai/investigate', {
        method: 'POST',
        body: { transaction_id: transactionId, question },
      })
      setAnalysis(result)
    } catch (error) {
      setRequestError(error)
    } finally {
      setInvestigating(false)
    }
  }

  const selected = transactions?.find((item) => item.transaction_id === transactionId)
  const canInvestigate = Boolean(transactionId && question.trim().length >= 5 && !investigating)

  return <>
    <PageHeader eyebrow="PAYMENT INTELLIGENCE" title="AI Investigator" description="Ask a question about a transaction. Responses currently come from a clearly labeled backend mock." />
    {transactionsLoading ? <LoadingState label="Loading demo transactions" /> : transactionsError ? <ErrorState error={transactionsError} onRetry={retry} /> : <div className="investigator-layout">
      <section className="panel panel-pad"><div className="panel-header"><div><h2>Start an investigation</h2><p>Choose a sample payment and provide a question.</p></div><span className="mock-label"><Sparkles size={11} />MOCK SERVICE</span></div>
        <form className="investigator-form" onSubmit={submitInvestigation}>
          <label className="form-label">Transaction<select required value={transactionId} onChange={(event) => { setSearchParams({ transactionId: event.target.value }, { replace: true }); setAnalysis(null) }}><option value="" disabled>Select a transaction</option>{(transactions || []).map((item) => <option value={item.transaction_id} key={item.transaction_id}>{item.transaction_id} · {item.customer_name} · {formatCurrency(item.amount, item.currency)} · {item.status}</option>)}</select></label>
          {selected && <div className="selected-transaction"><span>{selected.transaction_id}</span><strong>{selected.customer_name}</strong><span>{formatCurrency(selected.amount, selected.currency)}</span></div>}
          <label className="form-label">Your question<textarea required minLength={5} maxLength={500} placeholder="Ask about this payment..." value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
          <div className="question-suggestions" aria-label="Example questions">{sampleQuestions.map((sample) => <button className="suggestion-chip" key={sample} type="button" onClick={() => setQuestion(sample)}>{sample}</button>)}</div>
          {requestError && <ErrorState error={requestError} title="Investigation could not be completed" onRetry={() => submitInvestigation()} />}
          <button className="button button-primary" type="submit" disabled={!canInvestigate}>{investigating ? <><span className="button-spinner" />Investigating...</> : <><Sparkles size={14} />Investigate</>}</button>
        </form>
      </section>
      <section className="panel panel-pad analysis-card"><div className="panel-header"><div><h2>Investigation result</h2><p>Evidence from the selected demo transaction</p></div>{analysis && <span className="mock-label"><Sparkles size={11} />MOCK RESULT</span>}</div>
        {analysis ? <div className="analysis-result"><span className="mock-label">No AI provider connected</span><h3>{analysis.headline}</h3><p>{analysis.summary}</p><h4>Evidence checked</h4><ul className="evidence-list">{analysis.evidence.map((item) => <li key={item}><Check size={13} />{item}</li>)}</ul><div className="analysis-next-step"><strong>Suggested review:</strong> {analysis.suggested_next_step}</div></div> : <div className="analysis-empty"><div className="empty-illustration"><Sparkles size={18} /><span /><span /></div><strong>Ready when you are.</strong><p>Select a demo transaction and ask a question. The response is explanatory sample output, not a real AI determination.</p></div>}
      </section>
    </div>}
  </>
}