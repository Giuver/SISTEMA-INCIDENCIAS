import { useSnackbar } from 'notistack';

export const useNotification = () => {
    const { enqueueSnackbar } = useSnackbar();

    const notify = (message, variant = 'default') => {
        enqueueSnackbar(message, { variant });
    };

    return notify;
}; 