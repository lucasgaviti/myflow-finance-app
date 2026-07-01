import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { notifyError, notifySuccess } from '../lib/toast';

import type { Goal, GoalPriority } from '../types/goal';
import type { GoalContribution } from '../types/goalContribution';

type SupabaseGoal = {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  user_id: string;
  priority: GoalPriority;
  is_primary: boolean;
};

type SupabaseGoalContribution = {
  id: number;
  goal_id: number;
  amount: number;
  note: string | null;
  date: string;
  user_id: string;
};

type GoalInput = Omit<Goal, 'id'>;

type UpdateGoalInput = {
  id: number;
  title: string;
  targetAmount: number;
  deadline?: string | null;
  priority: GoalPriority;
  isPrimary: boolean;
};

type GoalContributionInput = {
  goalId: number;
  amount: number;
  note?: string | null;
  date: string;
};

type UpdateGoalContributionInput = {
  id: number;
  amount: number;
  note?: string | null;
  date: string;
};

const MIN_LOADING_TIME = 350;

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function sortGoals(goals: Goal[]) {
  return [...goals].sort((first, second) => {
    if (first.isPrimary && !second.isPrimary) {
      return -1;
    }

    if (!first.isPrimary && second.isPrimary) {
      return 1;
    }

    return second.id - first.id;
  });
}

function sortContributions(contributions: GoalContribution[]) {
  return [...contributions].sort((first, second) => {
    const dateDiff = new Date(second.date).getTime() - new Date(first.date).getTime();

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return second.id - first.id;
  });
}

function mapGoalFromSupabase(goal: SupabaseGoal): Goal {
  return {
    id: goal.id,
    title: goal.title,
    targetAmount: Number(goal.target_amount),
    currentAmount: Number(goal.current_amount),
    deadline: goal.deadline,
    priority: goal.priority,
    isPrimary: goal.is_primary,
  };
}

function mapContributionFromSupabase(
  contribution: SupabaseGoalContribution,
): GoalContribution {
  return {
    id: contribution.id,
    goalId: contribution.goal_id,
    amount: Number(contribution.amount),
    note: contribution.note,
    date: contribution.date,
  };
}

function mapGoalToSupabase(goal: GoalInput, userId: string) {
  return {
    title: goal.title.trim(),
    target_amount: goal.targetAmount,
    current_amount: goal.currentAmount,
    deadline: goal.deadline || null,
    priority: goal.priority,
    is_primary: goal.isPrimary,
    user_id: userId,
  };
}

function mapGoalUpdateToSupabase(goal: UpdateGoalInput) {
  return {
    title: goal.title.trim(),
    target_amount: goal.targetAmount,
    deadline: goal.deadline || null,
    priority: goal.priority,
    is_primary: goal.isPrimary,
  };
}

function mapContributionToSupabase(
  contribution: GoalContributionInput,
  userId: string,
) {
  return {
    goal_id: contribution.goalId,
    user_id: userId,
    amount: contribution.amount,
    note: contribution.note || null,
    date: contribution.date,
  };
}

function getTotalGoalAmount(contributions: { amount: number }[]) {
  return contributions.reduce((total, contribution) => {
    return total + Number(contribution.amount);
  }, 0);
}

export function useGoals() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((message: string) => {
    setError(message);
    notifyError(message);
  }, []);

  const fetchGoals = useCallback(async () => {
    if (!userId) {
      setGoals([]);
      setContributions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadingStart = Date.now();

    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('id', { ascending: false });

    if (goalsError) {
      handleError(goalsError.message);
      setGoals([]);
      setContributions([]);
      setIsLoading(false);
      return;
    }

    const { data: contributionsData, error: contributionsError } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('id', { ascending: false });

    const elapsed = Date.now() - loadingStart;

    if (elapsed < MIN_LOADING_TIME) {
      await wait(MIN_LOADING_TIME - elapsed);
    }

    if (contributionsError) {
      handleError(contributionsError.message);
      setGoals([]);
      setContributions([]);
      setIsLoading(false);
      return;
    }

    const mappedGoals = (goalsData ?? []).map((goal) =>
      mapGoalFromSupabase(goal as SupabaseGoal),
    );

    const mappedContributions = (contributionsData ?? []).map((contribution) =>
      mapContributionFromSupabase(contribution as SupabaseGoalContribution),
    );

    setGoals(sortGoals(mappedGoals));
    setContributions(sortContributions(mappedContributions));
    setIsLoading(false);
  }, [userId, handleError]);

  useEffect(() => {
    void fetchGoals();
  }, [fetchGoals]);

  const resetPrimaryGoals = useCallback(
    async (exceptGoalId?: number) => {
      if (!userId) {
        return false;
      }

      let query = supabase
        .from('goals')
        .update({ is_primary: false })
        .eq('user_id', userId);

      if (exceptGoalId) {
        query = query.neq('id', exceptGoalId);
      }

      const { error: resetError } = await query;

      if (resetError) {
        handleError(resetError.message);
        return false;
      }

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          exceptGoalId && goal.id === exceptGoalId
            ? goal
            : {
                ...goal,
                isPrimary: false,
              },
        ),
      );

      return true;
    },
    [userId, handleError],
  );

  const recalculateGoalAmount = useCallback(
    async (goalId: number): Promise<Goal | null> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return null;
      }

      const { data, error: contributionsError } = await supabase
        .from('goal_contributions')
        .select('amount')
        .eq('goal_id', goalId)
        .eq('user_id', userId);

      if (contributionsError) {
        handleError(contributionsError.message);
        return null;
      }

      const newCurrentAmount = getTotalGoalAmount(data ?? []);

      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .update({
          current_amount: newCurrentAmount,
        })
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

      if (goalError) {
        handleError(goalError.message);
        return null;
      }

      const mappedGoal = mapGoalFromSupabase(goalData as SupabaseGoal);

      setGoals((currentGoals) =>
        sortGoals(
          currentGoals.map((goal) =>
            goal.id === goalId ? mappedGoal : goal,
          ),
        ),
      );

      return mappedGoal;
    },
    [userId, handleError],
  );

  const addGoal = useCallback(
    async (goal: GoalInput): Promise<Goal | null> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return null;
      }

      if (!goal.title.trim()) {
        handleError('Informe um título para a meta.');
        return null;
      }

      if (goal.targetAmount <= 0) {
        handleError('Informe um valor válido para a meta.');
        return null;
      }

      if (goal.isPrimary) {
        const resetSuccessful = await resetPrimaryGoals();

        if (!resetSuccessful) {
          return null;
        }
      }

      const { data, error: insertError } = await supabase
        .from('goals')
        .insert(mapGoalToSupabase(goal, userId))
        .select()
        .single();

      if (insertError) {
        handleError(insertError.message);
        return null;
      }

      const createdGoal = mapGoalFromSupabase(data as SupabaseGoal);

      setGoals((currentGoals) => sortGoals([createdGoal, ...currentGoals]));

      notifySuccess('Meta criada com sucesso!');

      return createdGoal;
    },
    [userId, handleError, resetPrimaryGoals],
  );

  const updateGoal = useCallback(
    async (goal: UpdateGoalInput): Promise<Goal | null> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return null;
      }

      if (!goal.title.trim()) {
        handleError('Informe um título para a meta.');
        return null;
      }

      if (goal.targetAmount <= 0) {
        handleError('Informe um valor válido para a meta.');
        return null;
      }

      if (goal.isPrimary) {
        const resetSuccessful = await resetPrimaryGoals(goal.id);

        if (!resetSuccessful) {
          return null;
        }
      }

      const { data, error: updateError } = await supabase
        .from('goals')
        .update(mapGoalUpdateToSupabase(goal))
        .eq('id', goal.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        handleError(updateError.message);
        return null;
      }

      const updatedGoal = mapGoalFromSupabase(data as SupabaseGoal);

      setGoals((currentGoals) =>
        sortGoals(
          currentGoals.map((currentGoal) =>
            currentGoal.id === goal.id ? updatedGoal : currentGoal,
          ),
        ),
      );

      notifySuccess('Meta atualizada com sucesso!');

      return updatedGoal;
    },
    [userId, handleError, resetPrimaryGoals],
  );

  const addGoalContribution = useCallback(
    async (contribution: GoalContributionInput): Promise<GoalContribution | null> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return null;
      }

      if (contribution.amount <= 0) {
        handleError('Informe um valor válido para o aporte.');
        return null;
      }

      const goalExists = goals.some((goal) => goal.id === contribution.goalId);

      if (!goalExists) {
        handleError('Meta não encontrada.');
        return null;
      }

      const { data, error: insertError } = await supabase
        .from('goal_contributions')
        .insert(mapContributionToSupabase(contribution, userId))
        .select()
        .single();

      if (insertError) {
        handleError(insertError.message);
        return null;
      }

      const createdContribution = mapContributionFromSupabase(
        data as SupabaseGoalContribution,
      );

      setContributions((currentContributions) =>
        sortContributions([createdContribution, ...currentContributions]),
      );

      await recalculateGoalAmount(contribution.goalId);

      notifySuccess('Aporte registrado com sucesso!');

      return createdContribution;
    },
    [userId, goals, handleError, recalculateGoalAmount],
  );

  const updateGoalContribution = useCallback(
    async ({
      id,
      amount,
      note,
      date,
    }: UpdateGoalContributionInput): Promise<GoalContribution | null> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return null;
      }

      if (amount <= 0) {
        handleError('Informe um valor válido para o aporte.');
        return null;
      }

      const existingContribution = contributions.find(
        (contribution) => contribution.id === id,
      );

      if (!existingContribution) {
        handleError('Aporte não encontrado.');
        return null;
      }

      const { data, error: updateError } = await supabase
        .from('goal_contributions')
        .update({
          amount,
          note: note || null,
          date,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        handleError(updateError.message);
        return null;
      }

      const updatedContribution = mapContributionFromSupabase(
        data as SupabaseGoalContribution,
      );

      setContributions((currentContributions) =>
        sortContributions(
          currentContributions.map((contribution) =>
            contribution.id === id ? updatedContribution : contribution,
          ),
        ),
      );

      await recalculateGoalAmount(existingContribution.goalId);

      notifySuccess('Aporte atualizado com sucesso!');

      return updatedContribution;
    },
    [userId, contributions, handleError, recalculateGoalAmount],
  );

  const removeGoalContribution = useCallback(
    async (contributionId: number): Promise<boolean> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return false;
      }

      const contribution = contributions.find((item) => item.id === contributionId);

      if (!contribution) {
        handleError('Aporte não encontrado.');
        return false;
      }

      const { error: deleteError } = await supabase
        .from('goal_contributions')
        .delete()
        .eq('id', contributionId)
        .eq('user_id', userId);

      if (deleteError) {
        handleError(deleteError.message);
        return false;
      }

      setContributions((currentContributions) =>
        currentContributions.filter((item) => item.id !== contributionId),
      );

      await recalculateGoalAmount(contribution.goalId);

      notifySuccess('Aporte removido.');

      return true;
    },
    [userId, contributions, handleError, recalculateGoalAmount],
  );

  const removeGoal = useCallback(
    async (id: number): Promise<boolean> => {
      if (!userId) {
        handleError('Usuário não autenticado.');
        return false;
      }

      const { error: deleteError } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        handleError(deleteError.message);
        return false;
      }

      setGoals((currentGoals) => currentGoals.filter((goal) => goal.id !== id));

      setContributions((currentContributions) =>
        currentContributions.filter((contribution) => contribution.goalId !== id),
      );

      notifySuccess('Meta removida.');

      return true;
    },
    [userId, handleError],
  );

  const getGoalContributions = useCallback(
    (goalId: number) => {
      return contributions.filter((contribution) => contribution.goalId === goalId);
    },
    [contributions],
  );

  const primaryGoal = useMemo(() => {
    return goals.find((goal) => goal.isPrimary) ?? goals[0] ?? null;
  }, [goals]);

  const totalGoalsCurrentAmount = useMemo(() => {
    return goals.reduce((total, goal) => total + goal.currentAmount, 0);
  }, [goals]);

  const totalGoalsTargetAmount = useMemo(() => {
    return goals.reduce((total, goal) => total + goal.targetAmount, 0);
  }, [goals]);

  const goalsProgress =
    totalGoalsTargetAmount > 0
      ? Math.min((totalGoalsCurrentAmount / totalGoalsTargetAmount) * 100, 100)
      : 0;

  return {
    goals,
    contributions,
    primaryGoal,
    totalGoalsCurrentAmount,
    totalGoalsTargetAmount,
    goalsProgress,
    isLoading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    addGoalContribution,
    updateGoalContribution,
    removeGoalContribution,
    removeGoal,
    getGoalContributions,
  };
}