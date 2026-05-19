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
  canAssignTickets = false,
  users = [],
  t,
}) {
  const [problemTypes, setProblemTypes] = useState([]);
  const [loadingProblemTypes, setLoadingProblemTypes] = useState(Boolean(token));

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.active !== false),
    [departments],
  );
  const userDepartmentId = currentUser?.departmentId?._id || currentUser?.departmentId || "";
  const userDepartmentName =
    currentUser?.departmentName || currentUser?.team || "";
  const formDepartmentIsPlaceholder =
    form.department === "IT" &&
    userDepartmentName &&
    userDepartmentName !== "IT" &&
    !form.departmentId;
  const summaryDepartment = activeDepartments.find(
    (department) =>
      (department._id || department.id) === (form.departmentId || userDepartmentId) ||
      department.name === currentUser?.departmentName ||
      department.name === currentUser?.team ||
      (!formDepartmentIsPlaceholder && department.name === form.department),
  );
  const selectedPriority = form.criticalRequested && !canAssignTickets
    ? t("addTicket.priorities.high")
    : t(`addTicket.priorities.${form.priority || "medium"}`);
  const requesterName =
    currentUser?.role === "User"
      ? currentUser?.name || ""
      : form.requester || currentUser?.name || "";
  const submissionSummary = {
    requester: requesterName || t("common.currentUser"),
    department:
      summaryDepartment?.name ||
      (formDepartmentIsPlaceholder ? userDepartmentName : form.department) ||
      userDepartmentName ||
      "IT",
    priority: selectedPriority,
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
        const currentUserId = currentUser?.id || currentUser?._id || "";
        const isRequesterUser = currentUser?.role === "User";
        const nextRequester = isRequesterUser
          ? currentUser?.name || ""
          : currentForm.requester || currentUser?.name || "";
        const defaultRequesterUserId = isRequesterUser ? currentUserId : "";
        const requesterIdIsCurrentManager =
          canAssignTickets &&
          currentUser?.role !== "User" &&
          currentForm.requesterUserId === currentUserId;
        const nextRequesterUserId = requesterIdIsCurrentManager
          ? ""
          : isRequesterUser
            ? defaultRequesterUserId
            : currentForm.requesterUserId || defaultRequesterUserId;
        const nextDepartmentId =
          currentForm.departmentId ||
          currentUser?.departmentId?._id ||
          currentUser?.departmentId ||
          "";
        const nextUserDepartmentName =
          currentUser?.departmentName || currentUser?.team || "";
        const currentDepartmentIsPlaceholder =
          currentForm.department === "IT" &&
          nextUserDepartmentName &&
          nextUserDepartmentName !== "IT" &&
          !currentForm.departmentId;
        const department = activeDepartments.find(
          (item) =>
            (item._id || item.id) === nextDepartmentId ||
            item.name === currentUser?.departmentName ||
            item.name === currentUser?.team ||
            (!currentDepartmentIsPlaceholder && item.name === currentForm.department),
        );
        const resolvedDepartmentId = department?._id || department?.id || nextDepartmentId;
        const nextDepartment =
          department?.name ||
          (currentDepartmentIsPlaceholder ? nextUserDepartmentName : currentForm.department) ||
          nextUserDepartmentName ||
          "IT";

        const nextPriority = canAssignTickets
          ? currentForm.priority || "medium"
          : currentForm.criticalRequested
            ? "high"
            : "medium";
        const nextAssignedTo = canAssignTickets ? currentForm.assignedTo || "" : "";
        const nextDueDate = canAssignTickets ? currentForm.dueDate || "" : "";

        if (
          currentForm.requester === nextRequester &&
          currentForm.requesterUserId === nextRequesterUserId &&
          currentForm.departmentId === resolvedDepartmentId &&
          currentForm.department === nextDepartment &&
          currentForm.priority === nextPriority &&
          currentForm.assignedTo === nextAssignedTo &&
          currentForm.dueDate === nextDueDate
        ) {
          return currentForm;
        }

        return {
          ...currentForm,
          requester: nextRequester,
          requesterUserId: nextRequesterUserId,
          departmentId: resolvedDepartmentId,
          department: nextDepartment,
          priority: nextPriority,
          assignedTo: nextAssignedTo,
          dueDate: nextDueDate,
        };
      });
    };

    syncHiddenDefaults();

    return () => {
      ignore = true;
    };
  }, [activeDepartments, canAssignTickets, currentUser, setForm]);

  return (
    <AddTicketForm
      form={form}
      setForm={setForm}
      handleSubmit={handleSubmit}
      submitting={submitting}
      problemTypes={problemTypes}
      loadingProblemTypes={loadingProblemTypes}
      submissionSummary={submissionSummary}
      canAssignTickets={canAssignTickets}
      users={users}
      t={t}
    />
  );
}

export default AddTicketPage;
