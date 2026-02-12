const db = require('../../config/db');

exports.getAll = async () => {
    // Execute all queries in parallel for performance
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
        db.query('SELECT branch_id, branch_name FROM hospital_branch WHERE is_active = TRUE'),
        db.query('SELECT category_id, category_name FROM master_patient_category'),
        db.query('SELECT marital_status_id, status_name FROM master_marital_status'),
        db.query('SELECT blood_group_id, group_name FROM master_blood_group'),
        db.query('SELECT occupation_id, occupation_name FROM master_occupation'),
        db.query('SELECT education_level_id, level_name FROM master_education_level'),
        db.query('SELECT class_id, class_name FROM master_socio_economic_class'),
        db.query('SELECT relationship_id, relationship_name FROM master_relationship'),
        db.query('SELECT ward_id, ward_name, ward_type FROM master_ward WHERE is_active = TRUE'),
        db.query('SELECT bed_id, ward_id, bed_number, bed_status FROM master_bed')
    ]);

    return {
        hospital_branches: branches[0],
        patient_categories: categories[0],
        marital_statuses: maritalStatus[0],
        blood_groups: bloodGroups[0],
        occupations: occupations[0],
        education_levels: educationLevels[0],
        socio_economic_classes: socioEcons[0],
        relationships: relationships[0],
        wards: wards[0],
        beds: beds[0]
    };
};
