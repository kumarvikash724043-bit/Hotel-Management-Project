package com.grandhotel.hotel.dto;

import java.util.Map;

public final class Requests {
    private Requests() {}
    public record Login(String email, String password) {}
    public record SignUp(String name, String email, String password) {}
    public record Booking(String name, String mobile, String email, String homeTown, String address,
                         String governmentId, int guests, String checkIn, String checkOut, String roomId) {}
    public record FoodOrder(String bookingId, Map<String, Integer> items) {}
    public record Quantity(int quantity) {}
    public record Checkout(double services, double discount) {}
    public record Room(int number, String category, String type, double price) {}
}
