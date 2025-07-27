# Condiciones

Esta aplicación debe ser desarrollada en React, implementando la funcionalidad usando Express y persistiendo los datos con MongoDB.

La defensa consistirá en ejecutar la aplicación para mostrar su funcionalidad y, si está correctamente implementada, deberás mostrar el código fuente y explicar cómo funcionan las partes que se te indiquen.

Funcionalidad requerida
En la esquina superior izquierda debe ir el nombre del sitio.
En la esquina superior derecha deben haber dos botones: "Registrar" e "Ingresar", cuando no haya ningún usuario identificado.
Cuando el usuario haya ingresado, en la esquina izquierda debe estar el nombre del usuario y un botón "Salir".
Al pulsar en el nombre del usuario, se deberá poder editar los datos del mismo.
El sitio debe mostrar inicialmente una lista de contactos públicos ordenados por apellido y nombre.
El usuario que se registre podrá agregar nuevos contactos.
Los usuarios, al identificarse, podrán ver sus propios contactos y los contactos públicos que estén visibles.
Los usuarios son propietarios de los contactos que crean, siempre podrán visualizar sus contactos, editarlos o borrarlos.
Los usuarios podrán hacer público o privado sus contactos mediante un botón asociado a los mismos.
Las altas y la edición, así como la registración y el ingreso, se deben hacer en una página separada y, al completar la misma, debe regresar a la página principal.
Debe existir un usuario administrador que pueda visualizar todos los contactos, ya sean públicos o privados, estén visibles o no.
El usuario administrador puede ocultar o mostrar los contactos públicos mediante un botón que aparece en cada contacto.
Los usuarios se deben guardar como contactos privados con una contraseña asociada.
Los usuarios no deberán aparecer en el listado de contactos.
Los contactos deben tener:

Nombre y Apellido (obligatorio)
Empresa
Domicilio
Teléfonos
Email (obligatorio)
Propietario (usuario que lo creó)
Es Público (definido por el usuario propietario)
Es Visible (definido por el administrador)
Contraseña (en caso de ser un usuario)


app basic
