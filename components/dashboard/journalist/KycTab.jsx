/** @deprecated KYC review is in Review queue → open member → Documents */
import JournalistUnionMembers from './JournalistUnionMembers'
export default function KycTab(props) {
  return <JournalistUnionMembers variant="queue" {...props} />
}
