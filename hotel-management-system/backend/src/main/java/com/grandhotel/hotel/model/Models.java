package com.grandhotel.hotel.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

public final class Models {
    private Models() {}

    public record Room(String id, int number, String category, String type, BigDecimal price, String status) {
        public Room withStatus(String nextStatus) { return new Room(id, number, category, type, price, nextStatus); }
    }

    public record Booking(String id, String name, String mobile, String email, String homeTown,
                          String address, String governmentId, int guests, LocalDate checkIn,
                          LocalDate checkOut, long nights, String roomId, BigDecimal roomPrice,
                          BigDecimal totalRoomCharge, String status) {
        public Booking withStatus(String nextStatus) {
            return new Booking(id, name, mobile, email, homeTown, address, governmentId, guests,
                    checkIn, checkOut, nights, roomId, roomPrice, totalRoomCharge, nextStatus);
        }
    }

    public record Customer(String id, String name, String mobile, String email, String homeTown,
                           String address, String governmentId, int bookings) {}
    public record FoodItem(String id, String name, String category, String description,
                           BigDecimal price, boolean available) {}
    public record FoodOrder(String id, String bookingId, Map<String, Integer> items,
                            BigDecimal total, Instant createdAt) {}
    public record Invoice(String invoiceId, String bookingId, String guestName, String roomId,
                          LocalDate checkIn, LocalDate checkOut, long nights, BigDecimal roomCharges,
                          BigDecimal foodCharges, BigDecimal services, BigDecimal tax,
                          BigDecimal discount, BigDecimal grandTotal, Instant generatedAt) {}
    public record User(String id, String name, String email, String password, String role) {
        public User publicView() { return new User(id, name, email, "", role); }
    }
}
