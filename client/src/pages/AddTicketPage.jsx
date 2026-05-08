import AddTicketForm from "../components/AddTicketForm";

function AddTicketPage({
  canAssignTickets,
  form,
  handleSubmit,
  setForm,
  submitting,
  users,
}) {
  return (
    <AddTicketForm
      canAssignTickets={canAssignTickets}
      form={form}
      setForm={setForm}
      handleSubmit={handleSubmit}
      submitting={submitting}
      users={users}
    />
  );
}

export default AddTicketPage;
