import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AddTicketForm from "../components/AddTicketForm";
import { getProblemTypes } from "../services/problemTypeService";

function AddTicketPage({
  form,
  handleSubmit,
  setForm,
  submitting,
  token,
  hotelId = "all",
  currentUser,
  departments = [],
}) {
  const [problemTypes, setProblemTypes] = useState([]);
  const [loadingProblemTypes, setLoadingProblemTypes] = useState(Boolean(token));

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.active !== false),
    [departments],
  );
  const userDepartmentId = currentUser?.departmentId?._id || currentUser?.departmentId || "";
  const summaryDepartment = activeDepartments.find(
    (department) =>
      (department._id || department.id) === (form.departmentId || userDepartmentId) ||
      department.name === form.department ||
      department.name === currentUser?.departmentName ||
      department.name === currentUser?.team,
  );
  const submissionSummary = {
    requester: form.requester || currentUser?.name || "Current user",
    department:
      form.department ||
      summaryDepartment?.name ||
      currentUser?.departmentName ||
      currentUser?.team ||
      "IT",
    priority: "Medium",
  };

  useEffect(() => {
    if (!token) return undefined;

    let ignore = false;

    const loadProblemTypes = async () => {
      try {
        const types = await getProblemTypes(
          token,
          hotelId && hotelId !== "all" ? { hotelId } : undefined,
        );
        if (!ignore) setProblemTypes(types || []);
      } catch (error) {
        console.error("Failed to load problem types", error);
        if (!ignore) {
          setProblemTypes([]);
          toast.error("Unable to load issue categories");
        }
      } finally {
        if (!ignore) setLoadingProblemTypes(false);
      }
    };

    loadProblemTypes();

    return () => {
      ignore = true;
    };
  }, [hotelId, token]);

  useEffect(() => {
    if (!token) return undefined;

    let ignore = false;

    const setDefaultCategory = async () => {
      const activeTypes = problemTypes.filter((type) => type.active !== false);
      const currentCategoryExists = activeTypes.some((type) => type.name === form.category);

      await Promise.resolve();

      if (ignore || form.category || currentCategoryExists) return;

      const nextCategory = activeTypes[0]?.name || "";
      if (nextCategory) {
        setForm((currentForm) => ({
          ...currentForm,
          category: currentForm.category || nextCategory,
        }));
      }
    };

    setDefaultCategory();

    return () => {
      ignore = true;
    };
  }, [form.category, problemTypes, setForm, token]);

  useEffect(() => {
    if (!currentUser) return undefined;

    let ignore = false;

    const syncHiddenDefaults = async () => {
      await Promise.resolve();

      if (ignore) return;

      setForm((currentForm) => {
        const nextRequester = currentForm.requester || currentUser?.name || "";
        const nextRequesterUserId = currentForm.requesterUserId || currentUser?.id || currentUser?._id || "";
        const nextDepartmentId =
          currentForm.departmentId ||
          currentUser?.departmentId?._id ||
          currentUser?.departmentId ||
          "";
        const department = activeDepartments.find(
          (item) =>
            (item._id || item.id) === nextDepartmentId ||
            item.name === currentForm.department ||
            item.name === currentUser?.departmentName ||
            item.name === currentUser?.team,
        );
        const resolvedDepartmentId = department?._id || department?.id || nextDepartmentId;
        const nextDepartment =
          currentForm.department ||
          department?.name ||
          currentUser?.departmentName ||
          currentUser?.team ||
          "IT";

        if (
          currentForm.requester === nextRequester &&
          currentForm.requesterUserId === nextRequesterUserId &&
          currentForm.departmentId === resolvedDepartmentId &&
          currentForm.department === nextDepartment &&
          currentForm.priority === "medium" &&
          currentForm.assignedTo === "" &&
          currentForm.dueDate === ""
        ) {
          return currentForm;
        }

        return {
          ...currentForm,
          requester: nextRequester,
          requesterUserId: nextRequesterUserId,
          departmentId: resolvedDepartmentId,
          department: nextDepartment,
          priority: "medium",
          assignedTo: "",
          dueDate: "",
        };
      });
    };

    syncHiddenDefaults();

    return () => {
      ignore = true;
    };
  }, [activeDepartments, currentUser, setForm]);

  return (
    <AddTicketForm
      form={form}
      setForm={setForm}
      handleSubmit={handleSubmit}
      submitting={submitting}
      problemTypes={problemTypes}
      loadingProblemTypes={loadingProblemTypes}
      submissionSummary={submissionSummary}
    />
  );
}

export default AddTicketPage;
