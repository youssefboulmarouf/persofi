
import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {PersonJson} from "../model/PersofiModels";
import {createPerson, deletePerson, fetchPersons, updatePerson} from "../api/PersonsApi";

export interface PersonContextValue {
    persons: PersonJson[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    addPerson: (person: PersonJson) => Promise<PersonJson | undefined>;
    editPerson: (person: PersonJson) => void;
    removePerson: (person: PersonJson) => void;
}

const PersonContext = createContext<PersonContextValue | undefined>(undefined);

export const usePersonContext = (): PersonContextValue => {
    const context = useContext(PersonContext);
    if (context === undefined) {
        throw new Error("usePersonContext must be used within a PersonProvider");
    }
    return context;
}

export const PersonProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [persons, setPersons] = useState<PersonJson[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const addPerson = async (person: PersonJson): Promise<PersonJson | undefined> => {
        setLoading(true);
        setError(null);

        let personJson = undefined;
        try {
            personJson = await createPerson(person);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();

        return personJson;
    }

    const editPerson = async (person: PersonJson) => {
        setLoading(true);
        setError(null);

        try {
            await updatePerson(person);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();
    }

    const removePerson = async (person: PersonJson) => {
        setLoading(true);
        setError(null);

        try {
            await deletePerson(person);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();
    }

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPersons();
            setPersons(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const value: PersonContextValue = useMemo(() => ({
        persons,
        loading,
        error,
        refresh,
        addPerson,
        editPerson,
        removePerson
    }), [persons, loading, error]);

    return <PersonContext.Provider value={value}>{children}</PersonContext.Provider>;
}