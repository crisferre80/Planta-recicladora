import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@recicladora.com' },
    update: {},
    create: {
      email: 'admin@recicladora.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  })
  console.log('✅ Usuario admin creado:', admin.email)

  // Create supervisor user
  const supervisorPassword = await hashPassword('super123')
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@recicladora.com' },
    update: {},
    create: {
      email: 'supervisor@recicladora.com',
      password: supervisorPassword,
      name: 'Juan Pérez',
      role: 'SUPERVISOR',
      isActive: true,
    },
  })
  console.log('✅ Usuario supervisor creado:', supervisor.email)

  // Create operator user
  const operatorPassword = await hashPassword('oper123')
  const operator = await prisma.user.upsert({
    where: { email: 'operador@recicladora.com' },
    update: {},
    create: {
      email: 'operador@recicladora.com',
      password: operatorPassword,
      name: 'María García',
      role: 'OPERADOR',
      isActive: true,
    },
  })
  console.log('✅ Usuario operador creado:', operator.email)

  // Create accountant user
  const accountantPassword = await hashPassword('conta123')
  const accountant = await prisma.user.upsert({
    where: { email: 'contador@recicladora.com' },
    update: {},
    create: {
      email: 'contador@recicladora.com',
      password: accountantPassword,
      name: 'Carlos Rodríguez',
      role: 'CONTADOR',
      isActive: true,
    },
  })
  console.log('✅ Usuario contador creado:', accountant.email)

  // Create sample material types
  const materialPapel = await prisma.materialType.upsert({
    where: { name: 'Papel' },
    update: {},
    create: {
      name: 'Papel',
      category: 'PAPEL',
      description: 'Papel y cartón reciclable',
      unitPrice: 150.0,
      isActive: true,
    },
  })
  console.log('✅ Tipo de material creado:', materialPapel.name)

  const materialPlastico = await prisma.materialType.upsert({
    where: { name: 'Plástico PET' },
    update: {},
    create: {
      name: 'Plástico PET',
      category: 'PLASTICO',
      description: 'Botellas de plástico PET',
      unitPrice: 200.0,
      isActive: true,
    },
  })
  console.log('✅ Tipo de material creado:', materialPlastico.name)

  const materialVidrio = await prisma.materialType.upsert({
    where: { name: 'Vidrio' },
    update: {},
    create: {
      name: 'Vidrio',
      category: 'VIDRIO',
      description: 'Vidrio reciclable',
      unitPrice: 80.0,
      isActive: true,
    },
  })
  console.log('✅ Tipo de material creado:', materialVidrio.name)

  // Create sample equipment
  const equipo1 = await prisma.equipment.upsert({
    where: { code: 'COMP-001' },
    update: {},
    create: {
      code: 'COMP-001',
      name: 'Compactadora Principal',
      type: 'Compactadora',
      capacity: 5.0,
      status: 'OPERATIVO',
      location: 'Área de Compactación A',
    },
  })
  console.log('✅ Equipo creado:', equipo1.code)

  const equipo2 = await prisma.equipment.upsert({
    where: { code: 'COMP-002' },
    update: {},
    create: {
      code: 'COMP-002',
      name: 'Compactadora Secundaria',
      type: 'Compactadora',
      capacity: 3.5,
      status: 'OPERATIVO',
      location: 'Área de Compactación B',
    },
  })
  console.log('✅ Equipo creado:', equipo2.code)

  // Create sample work shifts
  const turnoManana = await prisma.workShift.upsert({
    where: { name: 'Turno Mañana' },
    update: {},
    create: {
      name: 'Turno Mañana',
      startTime: '06:00',
      endTime: '14:00',
      days: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      isActive: true,
    },
  })
  console.log('✅ Turno creado:', turnoManana.name)

  const turnoTarde = await prisma.workShift.upsert({
    where: { name: 'Turno Tarde' },
    update: {},
    create: {
      name: 'Turno Tarde',
      startTime: '14:00',
      endTime: '22:00',
      days: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
      isActive: true,
    },
  })
  console.log('✅ Turno creado:', turnoTarde.name)

  // Create sample taxes
  const iva = await prisma.tax.upsert({
    where: { name: 'IVA 21%' },
    update: {},
    create: {
      name: 'IVA 21%',
      percentage: 21.0,
      applicableTo: ['Venta Material'],
      isActive: true,
    },
  })
  console.log('✅ Impuesto creado:', iva.name)

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📝 Usuarios creados:')
  console.log('   Admin:      admin@recicladora.com / admin123')
  console.log('   Supervisor: supervisor@recicladora.com / super123')
  console.log('   Operador:   operador@recicladora.com / oper123')
  console.log('   Contador:   contador@recicladora.com / conta123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
