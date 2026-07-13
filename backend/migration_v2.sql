-- ============================================================
-- MatchPoint DB - Migration Script v2
-- Apply with MySQL Workbench on an existing matchpoint_db
-- ============================================================

USE matchpoint_db;

-- ------------------------------------------------------------
-- 1. Extend `complejos` table with new fields
-- ------------------------------------------------------------
ALTER TABLE complejos
    ADD COLUMN imagen_url        VARCHAR(255)   NULL        AFTER telefono,
    ADD COLUMN caracteristicas   VARCHAR(255)   NULL        AFTER imagen_url,
    ADD COLUMN valoracion        DECIMAL(3, 2)  NOT NULL DEFAULT 5.00 AFTER caracteristicas,
    ADD COLUMN telefono_whatsapp VARCHAR(50)    NULL        AFTER valoracion;

-- ------------------------------------------------------------
-- 2. Create `favoritos` table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favoritos (
    id          INT          NOT NULL AUTO_INCREMENT,
    id_cliente  INT          NOT NULL,
    id_complejo INT          NOT NULL,

    PRIMARY KEY (id),

    -- One user can only favourite each complex once
    CONSTRAINT uq_favorito_cliente_complejo
        UNIQUE (id_cliente, id_complejo),

    CONSTRAINT fk_favorito_cliente
        FOREIGN KEY (id_cliente)  REFERENCES usuarios  (id) ON DELETE CASCADE,

    CONSTRAINT fk_favorito_complejo
        FOREIGN KEY (id_complejo) REFERENCES complejos (id) ON DELETE CASCADE
);

-- ============================================================
-- End of migration v2
-- ============================================================
