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
  hotelId = "all",
  currentUser,
  departments = [],
}) {
  const [problemTypes, setProblemTypes] = useState([]);
  const [loadingProblemTypes, setLoadingProblemTypes] = useState(false);
  const [problemTypesLoaded, setProblemTypesLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadProblemTypes = async () => {
      try {
        setLoadingProblemTypes(true);
        const types = await getProblemTypes(
          token,
          hotelId && hotelId !== "all" ? { hotelId } : undefined,
        );
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
  }, [hotelId, token]);

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

  useEffect(() => {
    setForm((currentForm) => {
      const nextRequester = currentForm.requester || currentUser?.name || "";
      const nextRequesterUserId = currentForm.requesterUserId || currentUser?.id || currentUser?._id || "";
      const nextDepartmentId =
        currentForm.departmentId ||
        currentUser?.departmentId?._id ||
        currentUser?.departmentId ||
        "";
      const department = departments.find(
        (item) =>
          (item._id || item.id) === nextDepartmentId ||
          item.name === currentForm.department ||
          item.name === currentUser?.departmentName ||
          item.name === currentUser?.team,
      );
      const resolvedDepartmentId = department?._id || department?.id || nextDepartmentId;

      return {
        ...currentForm,
        requester: nextRequester,
        requesterUserId: nextRequesterUserId,
        departmentId: resolvedDepartmentId,
        department: currentForm.department || department?.name || currentUser?.departmentName || currentUser?.team || "IT",
      };
    });
  }, [currentUser, departments, setForm]);

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
      departments={departments}
    />
  );
}

export default AddTicketPage;
