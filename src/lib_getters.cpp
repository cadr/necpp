/***************************************************************************
 *   Getter functions for nec_context data access                          *
 ***************************************************************************/

#include "nec_context.h"
#include "c_geometry.h"
#include "nec_exception.h"
#include <string>

// Import the error message from libNEC.cpp
namespace {
  extern "C" const char* nec_error_message(void);
}

extern "C" {

/*! Geometry data access functions */

int nec_get_segment_count(nec_context* in_context) {
  c_geometry* geo = in_context->get_geometry();
  if (!geo) return 0;
  return geo->n_segments;
}

long nec_get_segment(nec_context* in_context, int segment_index,
                     double* x, double* y, double* z, double* length,
                     double* alpha, double* beta, double* radius) {
  try {
    c_geometry* geo = in_context->get_geometry();
    if (!geo || segment_index < 0 || segment_index >= geo->n_segments) {
      return 1;
    }

    if (x) *x = geo->x[segment_index];
    if (y) *y = geo->y[segment_index];
    if (z) *z = geo->z[segment_index];
    if (length) *length = geo->segment_length[segment_index];
    if (radius) *radius = geo->segment_radius[segment_index];

    // Compute angles from direction cosines
    if (alpha) {
      double cab_val = geo->cab[segment_index];
      *alpha = rad_to_degrees(acos(cab_val));
    }
    if (beta) {
      double sab_val = geo->sab[segment_index];
      double cab_val = geo->cab[segment_index];
      double sin_alpha = sqrt(1.0 - cab_val*cab_val);
      if (sin_alpha > 0.0001) {
        *beta = rad_to_degrees(asin(sab_val / sin_alpha));
      } else {
        *beta = 0.0;
      }
    }

    return 0;
  } catch (nec_exception* _ex) {
    return 1;
  }
}


/*! Current distribution access functions */

int nec_get_structure_currents_count(nec_context* in_context) {
  int count = 0;
  while (in_context->get_structure_currents(count) != NULL) {
    count++;
  }
  return count;
}

int nec_get_current_count(nec_context* in_context, int result_index) {
  nec_structure_currents* sc = in_context->get_structure_currents(result_index);
  if (!sc) return -1;
  return (int)sc->get_current().size();
}

long nec_get_current(nec_context* in_context, int result_index, int element_index,
                     int* segment_number, int* segment_tag,
                     double* x, double* y, double* z, double* length,
                     double* current_real, double* current_imag) {
  try {
    nec_structure_currents* sc = in_context->get_structure_currents(result_index);
    if (!sc) {
      return 1;
    }

    vector<nec_complex> currents = sc->get_current();
    if (element_index < 0 || element_index >= (int)currents.size()) {
      return 1;
    }

    if (segment_number) {
      vector<int> seg_nums = sc->get_current_segment_number();
      *segment_number = seg_nums[element_index];
    }
    if (segment_tag) {
      vector<int> seg_tags = sc->get_current_segment_tag();
      *segment_tag = seg_tags[element_index];
    }
    if (x) {
      vector<nec_float> xs = sc->get_current_segment_center_x();
      *x = xs[element_index];
    }
    if (y) {
      vector<nec_float> ys = sc->get_current_segment_center_y();
      *y = ys[element_index];
    }
    if (z) {
      vector<nec_float> zs = sc->get_current_segment_center_z();
      *z = zs[element_index];
    }
    if (length) {
      vector<nec_float> lengths = sc->get_current_segment_length();
      *length = lengths[element_index];
    }
    if (current_real) *current_real = currents[element_index].real();
    if (current_imag) *current_imag = currents[element_index].imag();

    return 0;
  } catch (nec_exception* _ex) {
    return 1;
  }
}

int nec_get_charge_count(nec_context* in_context, int result_index) {
  nec_structure_currents* sc = in_context->get_structure_currents(result_index);
  if (!sc) return -1;
  return (int)sc->get_q_density().size();
}

long nec_get_charge(nec_context* in_context, int result_index, int element_index,
                    int* segment_number, int* segment_tag,
                    double* x, double* y, double* z, double* length,
                    double* charge_real, double* charge_imag) {
  try {
    nec_structure_currents* sc = in_context->get_structure_currents(result_index);
    if (!sc) {
      return 1;
    }

    vector<nec_complex> charges = sc->get_q_density();
    if (element_index < 0 || element_index >= (int)charges.size()) {
      return 1;
    }

    if (segment_number) {
      vector<int> seg_nums = sc->get_q_density_segment_number();
      *segment_number = seg_nums[element_index];
    }
    if (segment_tag) {
      vector<int> seg_tags = sc->get_q_density_segment_tag();
      *segment_tag = seg_tags[element_index];
    }
    if (x) {
      vector<nec_float> xs = sc->get_q_density_segment_center_x();
      *x = xs[element_index];
    }
    if (y) {
      vector<nec_float> ys = sc->get_q_density_segment_center_y();
      *y = ys[element_index];
    }
    if (z) {
      vector<nec_float> zs = sc->get_q_density_segment_center_z();
      *z = zs[element_index];
    }
    if (length) {
      vector<nec_float> lengths = sc->get_q_density_segment_length();
      *length = lengths[element_index];
    }
    if (charge_real) *charge_real = charges[element_index].real();
    if (charge_imag) *charge_imag = charges[element_index].imag();

    return 0;
  } catch (nec_exception* _ex) {
    return 1;
  }
}


/*! Near field data access functions */

int nec_get_near_field_count(nec_context* in_context) {
  int count = 0;
  while (in_context->get_near_field_pattern(count) != NULL) {
    count++;
  }
  return count;
}

int nec_get_near_field_point_count(nec_context* in_context, int result_index) {
  nec_near_field_pattern* nfp = in_context->get_near_field_pattern(result_index);
  if (!nfp) return -1;
  return (int)nfp->get_x().size();
}

long nec_get_near_field_point(nec_context* in_context, int result_index, int point_index,
                               double* x, double* y, double* z,
                               double* ex_real, double* ex_imag,
                               double* ey_real, double* ey_imag,
                               double* ez_real, double* ez_imag) {
  try {
    nec_near_field_pattern* nfp = in_context->get_near_field_pattern(result_index);
    if (!nfp) {
      return 1;
    }

    vector<nec_float> xs = nfp->get_x();
    if (point_index < 0 || point_index >= (int)xs.size()) {
      return 1;
    }

    if (x) *x = xs[point_index];
    if (y) {
      vector<nec_float> ys = nfp->get_y();
      *y = ys[point_index];
    }
    if (z) {
      vector<nec_float> zs = nfp->get_z();
      *z = zs[point_index];
    }

    vector<nec_complex> field_x = nfp->get_field_x();
    vector<nec_complex> field_y = nfp->get_field_y();
    vector<nec_complex> field_z = nfp->get_field_z();

    if (ex_real) *ex_real = field_x[point_index].real();
    if (ex_imag) *ex_imag = field_x[point_index].imag();
    if (ey_real) *ey_real = field_y[point_index].real();
    if (ey_imag) *ey_imag = field_y[point_index].imag();
    if (ez_real) *ez_real = field_z[point_index].real();
    if (ez_imag) *ez_imag = field_z[point_index].imag();

    return 0;
  } catch (nec_exception* _ex) {
    return 1;
  }
}

} // extern "C"
