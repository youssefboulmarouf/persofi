import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPersons, createPerson, updatePerson, deletePerson } from "../api/PersonsApi";

export const usePersons = () => {
    return useQuery({
        queryKey: ["persons"],
        queryFn: fetchPersons,
    });
};

export const useAddPerson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPerson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["persons"] });
        },
    });
};

export const useUpdatePerson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updatePerson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["persons"] });
        },
    });
};

export const useDeletePerson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePerson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["persons"] });
        },
    });
};
