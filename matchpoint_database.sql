-- MySQL dump 10.13  Distrib 8.0.33, for Win64 (x86_64)
--
-- Host: localhost    Database: matchpoint_db
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `canchas`
--

DROP TABLE IF EXISTS `canchas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canchas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_complejo` int NOT NULL,
  `nombre_numero` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deporte` enum('PADEL','FUTBOL','TENIS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio_hora` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_canchas_complejo` (`id_complejo`),
  CONSTRAINT `fk_canchas_complejo` FOREIGN KEY (`id_complejo`) REFERENCES `complejos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canchas`
--

LOCK TABLES `canchas` WRITE;
/*!40000 ALTER TABLE `canchas` DISABLE KEYS */;
INSERT INTO `canchas` VALUES (1,1,'Cancha 1','FUTBOL',70000.00),(2,1,'Cancha 2','FUTBOL',70000.00),(3,1,'Cancha 3 (Techada)','FUTBOL',90000.00),(4,1,'Cancha 1 (Techada)','PADEL',55000.00),(5,1,'Cancha 2 (Techada)','PADEL',55000.00),(6,2,'Cancha 1','PADEL',65000.00),(7,2,'Cancha 2','PADEL',65000.00),(8,2,'Cancha 3','PADEL',65000.00),(9,2,'Cancha 4','PADEL',65000.00),(10,3,'Cancha 1 (Cemento)','TENIS',40000.00),(11,3,'Cancha 2 (Cemento)','TENIS',40000.00),(12,3,'Cancha 3 (Cemento)','TENIS',40000.00),(13,3,'Cancha 1 (Polvo)','TENIS',45000.00),(14,3,'Cancha 2 (Polvo)','TENIS',45000.00);
/*!40000 ALTER TABLE `canchas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complejos`
--

DROP TABLE IF EXISTS `complejos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complejos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_duenio` int NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen_url` text COLLATE utf8mb4_unicode_ci,
  `caracteristicas` text COLLATE utf8mb4_unicode_ci,
  `valoracion` decimal(3,2) NOT NULL DEFAULT '5.00',
  `telefono_whatsapp` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_complejos_duenio` (`id_duenio`),
  CONSTRAINT `fk_complejos_duenio` FOREIGN KEY (`id_duenio`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complejos`
--

LOCK TABLES `complejos` WRITE;
/*!40000 ALTER TABLE `complejos` DISABLE KEYS */;
INSERT INTO `complejos` VALUES (1,1,'Club Futpadel Center','Av Rivadavia 3412','11-6164-7687','https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/8c/06/4d/el-clasico-futbol-5.jpg?w=900&h=500&s=1, https://media.timeout.com/images/106149485/750/562/image.jpg, https://padelmagazine.fr/wp-content/uploads/2025/03/Super-Panoramic-4.jpg.webp, https://alquilatucancha.com/uploads/clubs/bg/efecto-padel-godoy-cruz.jpeg?181018','Pasto cintético, iluminación, Canchas abiertas, Canchas techadas',5.00,'5491161647687'),(2,2,'Padel Sport Club','Av San Martin 4567','11-6576-5463','https://cloudfront-us-east-1.images.arcpublishing.com/artear/XI2HFXEZ5FGOZGDJ6BEP2XB7KM.jpg, https://www.up.edu.mx/wp-content/uploads/2024/04/panamericana-inaugura-el-complejo-de-padel-aga-int-cuatro.jpg, https://alquilatucancha-public.s3.sa-east-1.amazonaws.com/production/public/clubs/bg/mundo-padel-club-cordoba.jpeg?925405','Canchas renovadas, Pasto cintético, Canchas abiertas',4.25,'5491165765463'),(3,3,'Complejo Tenis Norte','Libertad 4578','11-4321-7654','https://s7e6w6d2.delivery.rocketcdn.me/wp-content/uploads/2024/02/tenis.webp, https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsyMsVC57inoAt5A8oL-52w-F6jU_GQdh46kafImug0SCAhq6QpLg5d6vH&s=10, https://www.rfet.es/media/image/noticias/11442_Foto.1638268079.jpeg','Canchas Abiertas, Cemento, Polvo de ladrillo, Buffet',5.00,'5491143217654');
/*!40000 ALTER TABLE `complejos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favoritos`
--

DROP TABLE IF EXISTS `favoritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favoritos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_complejo` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_favorito_cliente_complejo` (`id_cliente`,`id_complejo`),
  KEY `fk_favorito_complejo` (`id_complejo`),
  CONSTRAINT `fk_favorito_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorito_complejo` FOREIGN KEY (`id_complejo`) REFERENCES `complejos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favoritos`
--

LOCK TABLES `favoritos` WRITE;
/*!40000 ALTER TABLE `favoritos` DISABLE KEYS */;
/*!40000 ALTER TABLE `favoritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas`
--

DROP TABLE IF EXISTS `reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_cancha` int NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `estado` enum('PENDIENTE','CONFIRMADA','CANCELADA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_pago` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_reservas_cliente` (`id_cliente`),
  KEY `fk_reservas_cancha` (`id_cancha`),
  CONSTRAINT `fk_reservas_cancha` FOREIGN KEY (`id_cancha`) REFERENCES `canchas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reservas_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas`
--

LOCK TABLES `reservas` WRITE;
/*!40000 ALTER TABLE `reservas` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('CLIENTE','DUENIO') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuarios_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Gonzalo Leone','gonzaleone03@gmail.com','$2b$12$ILRNPf.JeePjyIvLL/n7JOVor1KFx9ESlOdCE6nhFZvajjQdItSSW','DUENIO'),(2,'Juan Perez','juan@gmail.com','$2b$12$xsSYqRcR4vbPaziHQqQ9GuSle73J8KFq.CPYhFAIZNEdfl8x6ZTQy','DUENIO'),(3,'Agustin Lopez','agustinlo@gamil.com','$2b$12$rjRViTi4IEndV21Z1xG33.AHVcRADPnuv/MaBlAiR66odAD6BEVQG','DUENIO'),(4,'Damian Quintana','damianq@gmail.com','$2b$12$RQbOeM7g7SZ4B1/7Fbiobeg4DftBLT1ytLLV1Z/ozB328FLcV.bJi','CLIENTE');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-13 12:14:24
