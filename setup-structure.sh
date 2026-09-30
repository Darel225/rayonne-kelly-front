#!/bin/bash

DIRECTORIES=(
    "src/assets/images"
    "src/assets/icons"
    "src/assets/fonts"
    "src/components/common"
    "src/components/public"
    "src/components/residence"
    "src/components/client"
    "src/components/admin"
    "src/components/booking"
    "src/pages/public/Legal"
    "src/pages/client"
    "src/pages/admin"
    "src/layouts"
    "src/routes"
    "src/services"
    "src/hooks"
    "src/context"
    "src/utils"
    "src/constants"
    "src/data"
    "src/styles"
)

FILES=(
    "src/components/common/Button.jsx"
    "src/components/common/Input.jsx"
    "src/components/common/Modal.jsx"
    "src/components/common/Loader.jsx"
    "src/components/common/ErrorMessage.jsx"
    "src/components/common/EmptyState.jsx"
    "src/components/common/StatusBadge.jsx"
    "src/components/public/Navbar.jsx"
    "src/components/public/Footer.jsx"
    "src/components/public/Hero.jsx"
    "src/components/public/FilterBar.jsx"
    "src/components/public/ResidenceCard.jsx"
    "src/components/residence/ResidenceGallery.jsx"
    "src/components/residence/ResidenceFeatures.jsx"
    "src/components/residence/ResidenceAmenities.jsx"
    "src/components/residence/ResidenceAvailability.jsx"
    "src/components/client/ClientSidebar.jsx"
    "src/components/client/ConciergeService.jsx"
    "src/components/client/ReservationRow.jsx"
    "src/components/client/ProfileForm.jsx"
    "src/components/admin/StatCard.jsx"
    "src/components/booking/BookingForm.jsx"
    "src/components/booking/BookingSummary.jsx"
    "src/components/booking/BookingSuccess.jsx"
    "src/pages/public/Home.jsx"
    "src/pages/public/Collection.jsx"
    "src/pages/public/ResidenceDetail.jsx"
    "src/pages/public/Legal/Privacy.jsx"
    "src/pages/public/Legal/Terms.jsx"
    "src/pages/client/Login.jsx"
    "src/pages/client/Register.jsx"
    "src/pages/client/Dashboard.jsx"
    "src/pages/admin/AdminLogin.jsx"
    "src/pages/admin/Dashboard.jsx"
    "src/pages/admin/ResidencesManagement.jsx"
    "src/pages/admin/CreateResidence.jsx"
    "src/pages/admin/EditResidence.jsx"
    "src/pages/admin/BookingsManagement.jsx"
    "src/pages/admin/BookingDetails.jsx"
    "src/pages/admin/ClientsManagement.jsx"
    "src/pages/admin/UsersManagement.jsx"
    "src/pages/admin/SubscribersManagement.jsx"
    "src/pages/admin/AmenitiesManagement.jsx"
    "src/pages/admin/BillingManagement.jsx"
    "src/pages/admin/Settings.jsx"
    "src/layouts/PublicLayout.jsx"
    "src/layouts/ClientLayout.jsx"
    "src/layouts/AdminLayout.jsx"
    "src/routes/AppRoutes.jsx"
    "src/routes/AuthGuard.jsx"
    "src/routes/RoleGuard.jsx"
    "src/services/api.js"
    "src/services/authService.js"
    "src/services/residenceService.js"
    "src/services/bookingService.js"
    "src/services/clientService.js"
    "src/hooks/useAuth.js"
    "src/hooks/useResidences.js"
    "src/hooks/useBookings.js"
    "src/context/AuthContext.jsx"
    "src/context/BookingContext.jsx"
    "src/utils/formatPrice.js"
    "src/utils/formatDate.js"
    "src/utils/validators.js"
    "src/utils/slugify.js"
    "src/constants/app.js"
    "src/constants/booking.js"
    "src/constants/roles.js"
    "src/data/mockResidences.js"
    "src/styles/variables.css"
    "src/styles/animations.css"
)

CREATED_DIRS=0
CREATED_FILES=0
IGNORED_FILES=0
IGNORED_FILES_LIST=()

for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        ((CREATED_DIRS++))
    fi
done

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        touch "$file"
        ((CREATED_FILES++))
    else
        ((IGNORED_FILES++))
        IGNORED_FILES_LIST+=("$file")
    fi
done

echo "--- SUMMARY ---"
echo "Directories created: $CREATED_DIRS"
echo "Files created: $CREATED_FILES"
echo "Files ignored (already exist): $IGNORED_FILES"
if [ $IGNORED_FILES -gt 0 ]; then
    echo "Ignored files list:"
    for ignored in "${IGNORED_FILES_LIST[@]}"; do
        echo " - $ignored"
    done
fi
