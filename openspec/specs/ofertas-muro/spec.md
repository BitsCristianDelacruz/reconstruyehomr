# ofertas-muro Specification

## Purpose
Define el comportamiento verificable de ofertas-muro para el MVP local de Reconstruye, siguiendo el SRS y los controles de privacidad del proyecto.

## Requirements

### Requirement: Ofertas de ayuda
El sistema SHALL permitir crear y editar ofertas propias con categoría, zona, disponibilidad y condiciones, y archivarlas/cerrarlas. FR-20, FR-24.

#### Scenario: Ofertas de ayuda
- **WHEN** Un autor intenta publicar una oferta sin disponibilidad
- **THEN** Recibe error de validación sin publicar la oferta.

### Requirement: Descubrimiento filtrado
El sistema SHALL ofrecer muro paginado con filtros por solicitud/oferta, categoría, territorio, urgencia y estado visible, con orden cronológico sin puntuación de personas. FR-21–22.

#### Scenario: Descubrimiento filtrado
- **WHEN** Se filtra por materiales en Soacha
- **THEN** Solo aparecen publicaciones visibles que cumplen ambos filtros.

### Requirement: Detalle y visibilidad
El sistema SHALL excluir borradores, pausadas, ocultas y publicaciones de cuentas inactivas del muro y del detalle público, aunque se conozca su identificador. SHALL NOT devolver teléfono, correo ni identificador privado del autor. FR-23, BR-06.

#### Scenario: Detalle y visibilidad
- **WHEN** Un visitante abre el enlace de una publicación oculta
- **THEN** Recibe 404, sin contenido ni datos de contacto.

### Requirement: Mis publicaciones
El sistema SHALL ofrecer al autor su lista de borradores, activas, pausadas, cerradas y restringidas con acceso a sus acciones permitidas.

#### Scenario: Mis publicaciones
- **WHEN** Un autor abre Mis publicaciones
- **THEN** Ve solo sus publicaciones y su estado real, sin acceso a borradores de otras personas.
