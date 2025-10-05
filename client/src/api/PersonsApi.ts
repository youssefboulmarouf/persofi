import {PersonJson} from "../model/PersofiModels";

export const fetchPersons = async (): Promise<PersonJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/persons`);
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to fetch person');
    }
    return res.json();
}

export const createPerson = async (personJson: PersonJson): Promise<PersonJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/persons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to create person');
    }
    return res.json();
};

export const updatePerson = async (personJson: PersonJson): Promise<PersonJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/persons/${personJson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to update person');
    }
    return res.json();
};

export const deletePerson = async (personJson: PersonJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/persons/${personJson.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to delete person');
    }
};