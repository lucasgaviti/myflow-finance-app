import {
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';

import {
  useAuth,
} from '../contexts/AuthContext';

import {
  notifyError,
  notifySuccess,
} from '../lib/toast';

import type {
  Goal,
  GoalPriority,
} from '../types/goal';

import type {
  GoalContribution,
} from '../types/goalContribution';

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

function mapGoalFromSupabase(
  goal: SupabaseGoal,
): Goal {
  return {
    id: goal.id,

    title: goal.title,

    targetAmount:
      Number(goal.target_amount),

    currentAmount:
      Number(goal.current_amount),

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

    amount: Number(
      contribution.amount,
    ),

    note: contribution.note,

    date: contribution.date,
  };
}

export function useGoals() {
  const { user } = useAuth();

  const [goals, setGoals] =
    useState<Goal[]>([]);

  const [
    contributions,
    setContributions,
  ] = useState<GoalContribution[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  async function fetchGoals() {
    if (!user) {
      setGoals([]);
      setContributions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const {
      data: goalsData,
      error: goalsError,
    } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('id', {
        ascending: false,
      });

    if (goalsError) {
      notifyError(goalsError.message);
      setIsLoading(false);
      return;
    }

    const {
      data: contributionsData,
      error: contributionsError,
    } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', {
        ascending: false,
      })
      .order('id', {
        ascending: false,
      });

    if (contributionsError) {
      notifyError(
        contributionsError.message,
      );
      setIsLoading(false);
      return;
    }

    setGoals(
      (goalsData ?? []).map(
        mapGoalFromSupabase,
      ),
    );

    setContributions(
      (contributionsData ?? []).map(
        mapContributionFromSupabase,
      ),
    );

    setIsLoading(false);
  }

  useEffect(() => {
    fetchGoals();
  }, [user?.id]);

  async function recalculateGoalAmount(
    goalId: number,
  ) {
    if (!user) return null;

    const { data, error } =
      await supabase
        .from('goal_contributions')
        .select('amount')
        .eq('goal_id', goalId)
        .eq('user_id', user.id);

    if (error) {
      notifyError(error.message);
      return null;
    }

    const newCurrentAmount =
      (data ?? []).reduce(
        (acc, item) =>
          acc + Number(item.amount),
        0,
      );

    const {
      data: goalData,
      error: goalError,
    } = await supabase
      .from('goals')
      .update({
        current_amount:
          newCurrentAmount,
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (goalError) {
      notifyError(goalError.message);
      return null;
    }

    const mappedGoal =
      mapGoalFromSupabase(goalData);

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? mappedGoal
          : goal,
      ),
    );

    return mappedGoal;
  }

  async function addGoal(
    goal: Omit<Goal, 'id'>,
  ) {
    if (!user) return;

    if (goal.isPrimary) {
      const { error: resetError } =
        await supabase
          .from('goals')
          .update({
            is_primary: false,
          })
          .eq('user_id', user.id);

      if (resetError) {
        notifyError(resetError.message);
        return;
      }
    }

    const { error } = await supabase
      .from('goals')
      .insert({
        title: goal.title,

        target_amount:
          goal.targetAmount,

        current_amount:
          goal.currentAmount,

        deadline:
          goal.deadline,

        priority:
          goal.priority,

        is_primary:
          goal.isPrimary,

        user_id: user.id,
      });

    if (error) {
      notifyError(error.message);
      return;
    }

    await fetchGoals();

    notifySuccess(
      'Meta criada com sucesso!',
    );
  }

  async function updateGoal({
    id,
    title,
    targetAmount,
    deadline,
    priority,
    isPrimary,
  }: {
    id: number;
    title: string;
    targetAmount: number;
    deadline?: string | null;
    priority: GoalPriority;
    isPrimary: boolean;
  }) {
    if (!user) return;

    if (isPrimary) {
      const { error: resetError } =
        await supabase
          .from('goals')
          .update({
            is_primary: false,
          })
          .eq('user_id', user.id)
          .neq('id', id);

      if (resetError) {
        notifyError(resetError.message);
        return;
      }
    }

    const { data, error } =
      await supabase
        .from('goals')
        .update({
          title,

          target_amount:
            targetAmount,

          deadline:
            deadline || null,

          priority,

          is_primary:
            isPrimary,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
      notifyError(error.message);
      return;
    }

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === id
          ? mapGoalFromSupabase(data)
          : goal,
      ),
    );

    await fetchGoals();

    notifySuccess(
      'Meta atualizada com sucesso!',
    );
  }

  async function addGoalContribution({
    goalId,
    amount,
    note,
    date,
  }: {
    goalId: number;
    amount: number;
    note?: string | null;
    date: string;
  }) {
    if (!user) return;

    const goal =
      goals.find(
        (item) =>
          item.id === goalId,
      );

    if (!goal) {
      notifyError(
        'Meta não encontrada.',
      );
      return;
    }

    const {
      data: contributionData,
      error: contributionError,
    } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        amount,
        note: note || null,
        date,
      })
      .select()
      .single();

    if (contributionError) {
      notifyError(
        contributionError.message,
      );
      return;
    }

    setContributions((prev) => [
      mapContributionFromSupabase(
        contributionData,
      ),
      ...prev,
    ]);

    await recalculateGoalAmount(goalId);

    notifySuccess(
      'Aporte registrado com sucesso!',
    );
  }

  async function updateGoalContribution({
    id,
    amount,
    note,
    date,
  }: {
    id: number;
    amount: number;
    note?: string | null;
    date: string;
  }) {
    if (!user) return;

    const contribution =
      contributions.find(
        (item) =>
          item.id === id,
      );

    if (!contribution) {
      notifyError(
        'Aporte não encontrado.',
      );
      return;
    }

    const {
      data: contributionData,
      error,
    } = await supabase
      .from('goal_contributions')
      .update({
        amount,
        note: note || null,
        date,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      notifyError(error.message);
      return;
    }

    const mappedContribution =
      mapContributionFromSupabase(
        contributionData,
      );

    setContributions((prev) =>
      prev.map((item) =>
        item.id === id
          ? mappedContribution
          : item,
      ),
    );

    await recalculateGoalAmount(
      contribution.goalId,
    );

    notifySuccess(
      'Aporte atualizado com sucesso!',
    );
  }

  async function removeGoalContribution(
    contributionId: number,
  ) {
    if (!user) return;

    const contribution =
      contributions.find(
        (item) =>
          item.id === contributionId,
      );

    if (!contribution) {
      notifyError(
        'Aporte não encontrado.',
      );
      return;
    }

    const { error: deleteError } =
      await supabase
        .from('goal_contributions')
        .delete()
        .eq('id', contributionId)
        .eq('user_id', user.id);

    if (deleteError) {
      notifyError(deleteError.message);
      return;
    }

    setContributions((prev) =>
      prev.filter(
        (item) =>
          item.id !== contributionId,
      ),
    );

    await recalculateGoalAmount(
      contribution.goalId,
    );

    notifySuccess(
      'Aporte removido.',
    );
  }

  async function removeGoal(
    id: number,
  ) {
    if (!user) return;

    const { error } =
      await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
      notifyError(error.message);
      return;
    }

    setGoals((prev) =>
      prev.filter(
        (goal) =>
          goal.id !== id,
      ),
    );

    setContributions((prev) =>
      prev.filter(
        (item) =>
          item.goalId !== id,
      ),
    );

    notifySuccess(
      'Meta removida.',
    );
  }

  function getGoalContributions(
    goalId: number,
  ) {
    return contributions.filter(
      (item) =>
        item.goalId === goalId,
    );
  }

  return {
    goals,

    contributions,

    isLoading,

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