import React, { useState } from "react";
import { FaStar, FaRegStar, FaPhoneAlt, FaWhatsapp, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

const BusinessCard = ({ biz }) => {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);

  const toggleAccordion = () => setExpanded(!expanded);
  const toggleBookmark = () => setBookmarked(!bookmarked);
  const toggleModal = async () => {
    if (!showModal) {
      // Fetch images when modal opens
      await fetchImages();
    }
    setShowModal(!showModal);
  };

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone) => phone?.replace(/\D/g, "");

  // Function to fetch images dynamically
  const fetchImages = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/images?place_id=${biz.place_id}`);
      const data = await response.json();
  
      if (data.imageUrls.length > 0) {
        setImageUrls(data.imageUrls); // ✅ Save images for display
      } else {
        console.log("No images found for this business.");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 transition hover:shadow-xl text-left">
      {/* Business Logo */}
      {biz.logo && (
        <img
          src={biz.logo}
          alt={`${biz.name} logo`}
          className="w-16 h-16 object-contain mb-2 mx-auto"
        />
      )}

      {/* Bookmark Icon */}
      <div className="float-right cursor-pointer" onClick={toggleBookmark}>
        {bookmarked ? <FaStar color="#f39c12" /> : <FaRegStar color="#ccc" />}
      </div>

      <h2 className="text-xl font-bold text-gray-800">{biz.name}</h2>
      <p className="text-sm text-gray-600">
        ⭐ {biz.aggregatedReviews ? biz.aggregatedReviews : "No"} reviews &nbsp;
        ({biz.rating ? biz.rating : "No rating"})
      </p>

      {/* Distance Handling */}
      {biz.distance && !isNaN(biz.distance) ? (
        <p className="text-sm text-gray-600">
          <strong>Distance:</strong> {parseFloat(biz.distance).toFixed(2)} km
        </p>
      ) : (
        <p className="text-sm text-gray-600">
          <strong>Distance:</strong> N/A
        </p>
      )}

      <p className="text-gray-600 mt-2">{biz.address}</p>

      {/* Contact & Website */}
      <div className="mt-3 flex flex-wrap gap-2">
        {biz.phone && (
          <a href={`tel:${biz.phone}`} className="text-blue-600 flex items-center gap-1 hover:underline">
            <FaPhoneAlt /> {biz.phone}
          </a>
        )}
        {biz.phone && (
          <a
            href={`https://wa.me/${formatPhoneForWhatsApp(biz.phone)}?text=Hi, I saw your listing on Local Service Finder`}
            className="text-green-600 flex items-center gap-1 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp /> WhatsApp
          </a>
        )}
        {biz.website && (
          <a href={biz.website} className="text-blue-600 flex items-center gap-1 hover:underline" target="_blank" rel="noopener noreferrer">
            🌐 Visit Website
          </a>
        )}
      </div>

     {/* Show button only if images exist */}
{/* Show button only if images exist */}
{imageUrls.length > 0 && (
  {/* Show button only if images exist */}
{imageUrls.length > 0 && (
  <div className="mt-3">
    <button
      onClick={toggleModal}
      className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
    >
      📸 View Images
    </button>
  </div>
)}


      {/* Get Directions Button */}
      <div className="mt-4">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-500 px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
          style={{ color: "#ffffff", backgroundColor: "#2196F3" }}
        >
          📍 Get Directions
        </a>
      </div>

      {/* Mini Map */}
      {biz.latitude && biz.longitude && (
        <div className="mt-3">
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${biz.latitude},${biz.longitude}&zoom=15&size=280x150&maptype=roadmap&markers=color:red%7C${biz.latitude},${biz.longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`}
            alt="Mini Map"
            className="w-full h-auto rounded-lg"
          />
        </div>
      )}

     {/* Modal for Viewing Images */}
{showModal && (
  <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
      <h2 className="text-xl font-bold">Images</h2>
      <button onClick={toggleModal} className="absolute top-2 right-4 text-gray-600">✖</button>
      {imageUrls.length > 0 ? (
        imageUrls.map((url, index) => (
          <img key={index} src={url} alt={`Image ${index + 1}`} className="w-full h-auto mt-4 rounded-lg" />
        ))
      ) : (
        <p>No images available.</p>
      )}
    </div>
  </div>
)}
    </div>
  );
};

const BusinessCards = ({ businesses }) => {
  if (!businesses || businesses.length === 0) {
    return <p className="text-center text-gray-500 text-lg">No results found.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold text-center mb-4">🔎 Search Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((biz, index) => (
          <BusinessCard key={index} biz={biz} />
        ))}
      </div>
    </div>
  );
};

export default BusinessCards;
