const { prisma } = require('../../config/db');

exports.getAll = async () => {
    const [
        branches,
        categories,
        maritalStatus,
        bloodGroups,
        occupations,
        educationLevels,
        socioEcons,
        relationships,
        wards,
        beds
    ] = await Promise.all([
        prisma.$queryRaw`SELECT branch_id, branch_name FROM hospital_branch WHERE is_active = TRUE`,
        prisma.$queryRaw`SELECT category_id, category_name FROM master_patient_category`,
        prisma.$queryRaw`SELECT marital_status_id, status_name FROM master_marital_status`,
        prisma.$queryRaw`SELECT blood_group_id, group_name FROM master_blood_group`,
        prisma.$queryRaw`SELECT occupation_id, occupation_name FROM master_occupation`,
        prisma.$queryRaw`SELECT education_level_id, level_name FROM master_education_level`,
        prisma.$queryRaw`SELECT class_id, class_name FROM master_socio_economic_class`,
        prisma.$queryRaw`SELECT relationship_id, relationship_name FROM master_relationship`,
        prisma.$queryRaw`SELECT ward_id, ward_name, ward_type FROM master_ward WHERE is_active = TRUE`,
        prisma.$queryRaw`SELECT bed_id, ward_id, bed_number, bed_status FROM master_bed`
    ]);

    return {
        hospital_branches: branches,
        patient_categories: categories,
        marital_statuses: maritalStatus,
        blood_groups: bloodGroups,
        occupations: occupations,
        education_levels: educationLevels,
        socio_economic_classes: socioEcons,
        relationships: relationships,
        wards: wards,
        beds: beds
    };
};
