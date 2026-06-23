import { useEffect, useState } from 'react'
import { Modal, Button, FormField, Textarea } from '../../ui'

export default function RejectReaderModal({ isOpen, reader, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (isOpen) setReason('')
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject application"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={busy}
          >
            {busy ? 'Rejecting…' : 'Reject'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 mb-4">
        Reject <span className="font-medium">{reader?.displayName}</span>
        {reader?.readerProfile?.personaLabel ? ` (${reader.readerProfile.personaLabel})` : ''}?
      </p>
      <FormField label="Reason (optional)">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Could not verify department ID"
          rows={3}
        />
      </FormField>
    </Modal>
  )
}
