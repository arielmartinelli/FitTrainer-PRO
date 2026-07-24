import { initialTrainers, initialRoutines, initialStudents, initialMasterAdmin } from "./mockData";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const KEYS = {
  MASTER: "fittrainer_master_admin_v1",
  TRAINERS: "fittrainer_trainers_v1",
  ROUTINES: "fittrainer_routines_v1",
  STUDENTS: "fittrainer_students_v1"
};

export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.MASTER)) {
    localStorage.setItem(KEYS.MASTER, JSON.stringify(initialMasterAdmin));
  }
  if (!localStorage.getItem(KEYS.TRAINERS)) {
    localStorage.setItem(KEYS.TRAINERS, JSON.stringify(initialTrainers));
  }
  if (!localStorage.getItem(KEYS.ROUTINES)) {
    localStorage.setItem(KEYS.ROUTINES, JSON.stringify(initialRoutines));
  }
  if (!localStorage.getItem(KEYS.STUDENTS)) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(initialStudents));
  }
};

export const getMasterAdmin = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.MASTER) || "{}");
};

export const getTrainers = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem(KEYS.TRAINERS) || "[]");
};

export const saveTrainer = (trainer) => {
  const trainers = getTrainers();
  const index = trainers.findIndex((t) => t.id === trainer.id);
  
  const trainerData = {
    ...trainer,
    id: trainer.id || `trainer_${Date.now()}`,
    gender: trainer.gender || "male",
    status: trainer.status || "active",
    avatar: trainer.avatar || "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150&auto=format&fit=crop&q=80"
  };

  if (index >= 0) {
    trainers[index] = { ...trainers[index], ...trainerData };
  } else {
    trainers.push(trainerData);
  }
  localStorage.setItem(KEYS.TRAINERS, JSON.stringify(trainers));

  // Sync con Supabase si está configurado
  if (isSupabaseConfigured()) {
    supabase.from("trainers").upsert([{
      id: trainerData.id,
      name: trainerData.name,
      email: trainerData.email,
      username: trainerData.username,
      password: trainerData.password,
      brand_name: trainerData.brandName || "",
      phone: trainerData.phone || ""
    }]).then(({ error }) => {
      if (error) console.error("Error sincronizando profesor con Supabase:", error);
    });
  }

  return trainers;
};

export const deleteTrainer = (trainerId) => {
  const trainers = getTrainers();
  const updated = trainers.filter((t) => t.id !== trainerId);
  localStorage.setItem(KEYS.TRAINERS, JSON.stringify(updated));

  if (isSupabaseConfigured()) {
    supabase.from("trainers").delete().eq("id", trainerId).then();
  }

  return updated;
};

export const toggleTrainerAccess = (trainerId) => {
  const trainers = getTrainers();
  const updated = trainers.map((t) => {
    if (t.id === trainerId) {
      return { ...t, status: t.status === "revoked" ? "active" : "revoked" };
    }
    return t;
  });
  localStorage.setItem(KEYS.TRAINERS, JSON.stringify(updated));
  return updated;
};

export const getRoutines = (trainerId = null) => {
  initializeStorage();
  const routines = JSON.parse(localStorage.getItem(KEYS.ROUTINES) || "[]");
  if (trainerId) {
    return routines.filter((r) => r.trainerId === trainerId);
  }
  return routines;
};

export const saveRoutine = (routine) => {
  const routines = getRoutines();
  const index = routines.findIndex((r) => r.id === routine.id);
  
  const formattedRoutine = {
    ...routine,
    durationWeeks: Number(routine.durationWeeks || 6)
  };

  if (index >= 0) {
    routines[index] = { ...routines[index], ...formattedRoutine };
  } else {
    routines.push({
      ...formattedRoutine,
      id: routine.id || `routine_${Date.now()}`
    });
  }
  localStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));

  if (isSupabaseConfigured()) {
    supabase.from("routines").upsert([{
      id: formattedRoutine.id,
      trainer_id: formattedRoutine.trainerId,
      title: formattedRoutine.title,
      category: formattedRoutine.category,
      duration_weeks: formattedRoutine.durationWeeks,
      description: formattedRoutine.description,
      days: formattedRoutine.days
    }]).then();
  }

  return routines;
};

export const deleteRoutine = (routineId) => {
  const routines = getRoutines();
  const updated = routines.filter((r) => r.id !== routineId);
  localStorage.setItem(KEYS.ROUTINES, JSON.stringify(updated));

  if (isSupabaseConfigured()) {
    supabase.from("routines").delete().eq("id", routineId).then();
  }

  return updated;
};

export const getStudents = (trainerId = null) => {
  initializeStorage();
  const students = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || "[]");
  if (trainerId) {
    return students.filter((s) => s.trainerId === trainerId);
  }
  return students;
};

export const saveStudent = (student) => {
  const students = getStudents();
  const index = students.findIndex((s) => s.id === student.id);
  
  let defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  if (student.gender === "female") {
    defaultAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80";
  } else if (student.gender === "male") {
    defaultAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";
  }

  const studentData = {
    ...student,
    id: student.id || `student_${Date.now()}`,
    status: student.status || "active",
    gender: student.gender || "male",
    avatar: student.avatar || defaultAvatar,
    paymentStatus: student.paymentStatus || "paid",
    nextDueDate: student.nextDueDate || "2026-08-15",
    questionnaireCompleted: student.questionnaireCompleted || false,
    questionnaireData: student.questionnaireData || null,
    payments: student.payments || [],
    completedWorkouts: student.completedWorkouts || []
  };

  if (index >= 0) {
    students[index] = { ...students[index], ...studentData };
  } else {
    students.push(studentData);
  }
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));

  if (isSupabaseConfigured()) {
    supabase.from("students").upsert([{
      id: studentData.id,
      trainer_id: studentData.trainerId,
      name: studentData.name,
      username: studentData.username,
      password: studentData.password,
      gender: studentData.gender,
      goal: studentData.goal,
      plan_name: studentData.planName,
      plan_price: studentData.planPrice,
      status: studentData.status,
      payment_status: studentData.paymentStatus,
      next_due_date: studentData.nextDueDate,
      assigned_routine_id: studentData.assignedRoutineId,
      questionnaire_completed: studentData.questionnaireCompleted,
      questionnaire_data: studentData.questionnaireData
    }]).then();
  }

  return students;
};

export const deleteStudent = (studentId) => {
  const students = getStudents();
  const updated = students.filter((s) => s.id !== studentId);
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));

  if (isSupabaseConfigured()) {
    supabase.from("students").delete().eq("id", studentId).then();
  }

  return updated;
};

export const toggleStudentAccess = (studentId) => {
  const students = getStudents();
  const updated = students.map((s) => {
    if (s.id === studentId) {
      return { ...s, status: s.status === "revoked" ? "active" : "revoked" };
    }
    return s;
  });
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
  return updated;
};

export const saveStudentQuestionnaire = (studentId, questionnaireData) => {
  const students = getStudents();
  const updated = students.map((s) => {
    if (s.id === studentId) {
      let genderAvatar = s.avatar;
      if (questionnaireData.gender === "female") {
        genderAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80";
      } else if (questionnaireData.gender === "male") {
        genderAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";
      }

      return {
        ...s,
        name: questionnaireData.fullName || s.name,
        gender: questionnaireData.gender || "male",
        avatar: genderAvatar,
        questionnaireCompleted: true,
        questionnaireData
      };
    }
    return s;
  });
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
  return updated;
};

export const reopenStudentQuestionnaire = (studentId) => {
  const students = getStudents();
  const updated = students.map((s) => {
    if (s.id === studentId) {
      return {
        ...s,
        questionnaireCompleted: false
      };
    }
    return s;
  });
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
  return updated;
};

export const recordStudentPayment = (studentId, paymentData) => {
  const students = getStudents();
  const updated = students.map((s) => {
    if (s.id === studentId) {
      const newPayment = {
        id: `pay_${Date.now()}`,
        date: paymentData.date || new Date().toISOString().split("T")[0],
        amount: Number(paymentData.amount),
        method: paymentData.method || "Transferencia Bancaria",
        notes: paymentData.notes || "",
        status: "Aprobado"
      };
      
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextDueDateStr = nextDate.toISOString().split("T")[0];

      return {
        ...s,
        paymentStatus: "paid",
        nextDueDate: nextDueDateStr,
        payments: [newPayment, ...(s.payments || [])]
      };
    }
    return s;
  });
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
  return updated;
};

export const logCompletedWorkout = (studentId, workoutData) => {
  const students = getStudents();
  const updated = students.map((s) => {
    if (s.id === studentId) {
      const newWorkout = {
        id: `w_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        ...workoutData
      };
      return {
        ...s,
        completedWorkouts: [newWorkout, ...(s.completedWorkouts || [])]
      };
    }
    return s;
  });
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
  return updated;
};
