const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
    // Función helper para enviar notificación en tiempo real
    static async sendRealTimeNotification(notification) {
        try {
            if (global.sendNotification) {
                global.sendNotification(notification.recipient.toString(), {
                    id: notification._id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    priority: notification.priority,
                    createdAt: notification.createdAt
                });
            }
        } catch (error) {
            console.error('Error sending real-time notification:', error);
        }
    }

    // Crear notificación de incidencia creada
    static async createIncidentCreatedNotification(incident, creator) {
        try {
            // Notificar a todos los usuarios de soporte y admin
            const supportUsers = await User.find({
                role: { $in: ['soporte', 'admin'] }
            });

            const notifications = supportUsers.map(user => ({
                type: 'incident_created',
                title: 'Nueva Incidencia Creada',
                message: `Se ha creado una nueva incidencia: "${incident.subject}" con prioridad ${incident.priority}`,
                recipient: user._id,
                sender: creator._id,
                relatedIncident: incident._id,
                priority: incident.priority === 'Crítica' ? 'high' : incident.priority === 'Alta' ? 'high' : 'medium'
            }));

            const savedNotifications = await Notification.insertMany(notifications);

            // Enviar notificaciones en tiempo real
            savedNotifications.forEach(notification => {
                this.sendRealTimeNotification(notification);
            });

            return savedNotifications;
        } catch (error) {
            console.error('Error creating incident created notification:', error);
        }
    }

    // Crear notificación de incidencia asignada
    static async createIncidentAssignedNotification(incident, assignedUser, assignedBy) {
        try {
            const notification = new Notification({
                type: 'incident_assigned',
                title: 'Incidencia Asignada',
                message: `Se te ha asignado la incidencia: "${incident.subject}"`,
                recipient: assignedUser._id,
                sender: assignedBy._id,
                relatedIncident: incident._id,
                priority: incident.priority === 'Crítica' ? 'high' : 'medium'
            });

            const savedNotification = await notification.save();

            // Enviar notificación en tiempo real
            this.sendRealTimeNotification(savedNotification);

            return savedNotification;
        } catch (error) {
            console.error('Error creating incident assigned notification:', error);
        }
    }

    // Crear notificación de cambio de estado
    static async createStatusChangedNotification(incident, newStatus, changedBy) {
        try {
            const statusMessages = {
                'en_proceso': 'ha comenzado a trabajar en',
                'resuelto': 'ha resuelto',
                'cerrado': 'ha cerrado'
            };

            const message = statusMessages[newStatus] || 'ha cambiado el estado de';

            const notification = new Notification({
                type: 'incident_status_changed',
                title: 'Estado de Incidencia Cambiado',
                message: `${changedBy.name} ${message} la incidencia: "${incident.subject}"`,
                recipient: incident.createdBy,
                sender: changedBy._id,
                relatedIncident: incident._id,
                priority: 'medium'
            });

            const savedNotification = await notification.save();

            // Enviar notificación en tiempo real
            this.sendRealTimeNotification(savedNotification);

            return savedNotification;
        } catch (error) {
            console.error('Error creating status changed notification:', error);
        }
    }

    // Crear notificación de incidencia resuelta
    static async createIncidentResolvedNotification(incident, resolvedBy) {
        try {
            const notification = new Notification({
                type: 'incident_resolved',
                title: 'Incidencia Resuelta',
                message: `La incidencia "${incident.subject}" ha sido resuelta por ${resolvedBy.name}`,
                recipient: incident.createdBy,
                sender: resolvedBy._id,
                relatedIncident: incident._id,
                priority: 'medium'
            });

            const savedNotification = await notification.save();

            // Enviar notificación en tiempo real
            this.sendRealTimeNotification(savedNotification);

            return savedNotification;
        } catch (error) {
            console.error('Error creating incident resolved notification:', error);
        }
    }

    // Crear notificación de usuario creado (solo para admin)
    static async createUserCreatedNotification(newUser, createdBy) {
        try {
            const adminUsers = await User.find({ role: 'admin' });

            const notifications = adminUsers.map(admin => ({
                type: 'user_created',
                title: 'Nuevo Usuario Creado',
                message: `Se ha creado un nuevo usuario: ${newUser.name} (${newUser.email})`,
                recipient: admin._id,
                sender: createdBy._id,
                relatedUser: newUser._id,
                priority: 'low'
            }));

            const savedNotifications = await Notification.insertMany(notifications);

            // Enviar notificaciones en tiempo real
            savedNotifications.forEach(notification => {
                this.sendRealTimeNotification(notification);
            });

            return savedNotifications;
        } catch (error) {
            console.error('Error creating user created notification:', error);
        }
    }

    // Crear notificación de usuario eliminado (solo para admin)
    static async createUserDeletedNotification(deletedUser, deletedBy) {
        try {
            const adminUsers = await User.find({ role: 'admin' });

            const notifications = adminUsers.map(admin => ({
                type: 'user_deleted',
                title: 'Usuario Eliminado',
                message: `Se ha eliminado el usuario: ${deletedUser.name} (${deletedUser.email})`,
                recipient: admin._id,
                sender: deletedBy._id,
                priority: 'medium'
            }));

            const savedNotifications = await Notification.insertMany(notifications);

            // Enviar notificaciones en tiempo real
            savedNotifications.forEach(notification => {
                this.sendRealTimeNotification(notification);
            });

            return savedNotifications;
        } catch (error) {
            console.error('Error creating user deleted notification:', error);
        }
    }

    // Crear notificación de categoría creada (solo para admin)
    static async createCategoryCreatedNotification(category, createdBy) {
        try {
            const adminUsers = await User.find({ role: 'admin' });

            const notifications = adminUsers.map(admin => ({
                type: 'category_created',
                title: 'Nueva Categoría Creada',
                message: `Se ha creado una nueva categoría: ${category.name}`,
                recipient: admin._id,
                sender: createdBy._id,
                priority: 'low'
            }));

            const savedNotifications = await Notification.insertMany(notifications);

            // Enviar notificaciones en tiempo real
            savedNotifications.forEach(notification => {
                this.sendRealTimeNotification(notification);
            });

            return savedNotifications;
        } catch (error) {
            console.error('Error creating category created notification:', error);
        }
    }

    // Crear notificación de categoría eliminada (solo para admin)
    static async createCategoryDeletedNotification(categoryName, deletedBy) {
        try {
            const adminUsers = await User.find({ role: 'admin' });

            const notifications = adminUsers.map(admin => ({
                type: 'category_deleted',
                title: 'Categoría Eliminada',
                message: `Se ha eliminado la categoría: ${categoryName}`,
                recipient: admin._id,
                sender: deletedBy._id,
                priority: 'medium'
            }));

            const savedNotifications = await Notification.insertMany(notifications);

            // Enviar notificaciones en tiempo real
            savedNotifications.forEach(notification => {
                this.sendRealTimeNotification(notification);
            });

            return savedNotifications;
        } catch (error) {
            console.error('Error creating category deleted notification:', error);
        }
    }
}

module.exports = NotificationService; 