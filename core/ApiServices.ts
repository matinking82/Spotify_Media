import axios from 'axios';
import logger from './logger';

const AUTH_API = process.env.AUTHSERVICEURL;


export const validateToken = async (token: string) => {
    try {
        //send token via Bearer Authorization header to /auth/validate
        const response = await axios.get(`${AUTH_API}/auth/validate`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            return {
                success: true,
                data: response.data.user as {
                    id: number
                }
            }
        }

        return {
            success: false,
            message: 'Invalid token'
        }
    } catch (error) {
        logger.error(error, {
            section: 'ApiServices.validateToken'
        });

        return {
            success: false,
            message: 'An error occurred while validating token'
        }
    }
};