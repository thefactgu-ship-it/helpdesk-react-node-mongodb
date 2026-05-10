import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AddTicketForm from "../components/AddTicketForm";
import { getProblemTypes } from "../services/problemTypeService";

function AddTicketPage({
  canAssignTickets,
  form,
  handleSubmit,
  setForm,
  submitting,
  users,
  token,
}) {
  const [problemTypes, setProblemTypes] = useState([]);
  const [loadingProblemTypes, setLoadingProblemTypes] = useState(false);
  const [problemTypesLoaded, setProblemTypesLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadProblemTypes = async () => {
      try {
        setLoadingProblemTypes(true);
        const types = await getProblemTypes(token);
        setProblemTypes(types || []);
      } catch (error) {
        console.error("Failed to load problem types", error);
        setProblemTypes([]);
        toast.error("Unable to load issue categories");
      } finally {
        setProblemTypesLoaded(true);
        setLoadingProblemTypes(false);
      }
    };

    loadProblemTypes();
  }, [token]);

  useEffect(() => {
    if (!problemTypesLoaded) return;

    const activeTypes = problemTypes.filter((type) => type.active !== false);
    const currentCategoryExists = activeTypes.some(
      (type) => type.name === form.category,
    );
    const nextCategory = currentCategoryExists ? form.category : activeTypes[0]?.name || "";

    if (nextCategory !== form.category) {
      setForm((currentForm) => ({
        ...currentForm,
        category: nextCategory,
      }));
    }
  }, [form.category, problemTypes, problemTypesLoaded, setForm]);

  return (
    <AddTicketForm
      canAssignTickets={canAssignTickets}
      form={form}
      setForm={setForm}
      handleSubmit={handleSubmit}
      submitting={submitting}
      users={users}
      problemTypes={problemTypes}
      loadingProblemTypes={loadingProblemTypes}
    />
  );
}

export default AddTicketPage;
