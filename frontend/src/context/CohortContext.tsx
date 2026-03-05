import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Cohort } from '../types';
import { MOCK_COHORTS } from '../data/mockData';
import { useAuth } from './AuthContext';

interface CohortContextType {
    cohorts: Cohort[];
    selectedCohort: Cohort | null;
    selectCohort: (id: string) => void;
}

const CohortContext = createContext<CohortContextType | null>(null);

export function CohortProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();

    const userCohorts = MOCK_COHORTS.filter(c =>
currentUser?.cohortId === c.id

    );

    const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(
        userCohorts[0] ?? null
    );

    const selectCohort = useCallback((id: string) => {
        const cohort = MOCK_COHORTS.find(c => c.id === id) ?? null;
        setSelectedCohort(cohort);
    }, []);

    return (
        <CohortContext.Provider value={{ cohorts: userCohorts, selectedCohort, selectCohort }}>
            {children}
        </CohortContext.Provider>
    );
}

export function useCohort() {
    const ctx = useContext(CohortContext);
    if (!ctx) throw new Error('useCohort must be used inside CohortProvider');
    return ctx;
}
