// Constantes centralizadas de Talento Humano para uso consistente en toda la aplicación

export const TALENTO_HUMANO_USERS = [
  {'correo':'talentohumano@gyj.com.co', 'nombre': 'Jessica Alexandra Diaz'},
  {'correo':'direccion_th@gyj.com.co', 'nombre': 'Carolina Rivera Vargas'},
  {'correo':'auxiliar.nomina@gyj.com.co', 'nombre': 'Kerrin Yesenia Collazos'},
  {'correo':'asistente.nomina@gyj.com.co', 'nombre': 'Asistente Nomina'}
];

// Helper para verificar si un correo pertenece a Talento Humano
export const isTalentoHumanoEmail = (email) => {
  if (!email) return false;
  return TALENTO_HUMANO_USERS.some(user => 
    user.correo.toLowerCase() === email.toLowerCase()
  );
};

// Helper para obtener el nombre de Talento Humano por correo
export const getTalentoHumanoName = (email) => {
  const user = TALENTO_HUMANO_USERS.find(user => 
    user.correo.toLowerCase() === email.toLowerCase()
  );
  return user ? user.nombre : '';
};